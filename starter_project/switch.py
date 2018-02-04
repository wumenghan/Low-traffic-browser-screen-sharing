import sys
import json
import time
import socket 
import logging
import threading 
import concurrent.futures

# TODO
# 1. write switch as class - DONE
# 2. send KEEP_ALIVE, TOPOLOGY_UPDATE request periodically
# 3. log the request
# 4. CONTROLLER_PORT = 8000, CONTROLLER_HOST = "localhost"
# 5. Discuss name of live neighbors with hgp
SWITCH_HOST = "localhost"

def threaded(daemon):
	def decorator(fn):
		def wrapper(*args, **kwargs):
			thread = threading.Thread(target=fn, args=args, kwargs=kwargs)
			if daemon:
				thread.daemon = True
			thread.start()
			return thread
		return wrapper
	return decorator

class Switch(object):
	def __init__(self, switch_id, con_hostname, con_port, fail_neighbor=None):
		self.id = switch_id
		self.con_hostname = con_hostname
		self.con_port = con_port
		self.port = 8000 + switch_id
		self.host = "localhost"
		self.neighbors = {}
		self.period = 5  # Send update message every 5 seconds.
		self.fail_neighbor = fail_neighbor
	
	def init_socket(self):
		try:
			self.s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)	
		except sockect.error:
			logging.debug("Fail to create socket\n")
			sys.exit()
		try:
			self.s.bind((self.host, self.port))
		except (socket.error, msg):
			logging.debug("Bind failed. Error Code : " + str(msg[0]) + "Message " + msg[1])
		logging.warning("Socket init success\n")	

	def connect_host(self):
		msg = {"signal":"REGISTER_REQUEST", "id":self.id}
		self.send_msg(msg, (self.con_hostname, self.con_port))
		logging.warning("Send REGISTER_REQUEST to controller\n")

	def send_msg(self, msg, addr):
		if isinstance(msg, dict):
			self.s.sendto(json.dumps(msg).encode(), addr)
		else:
			self.s.sendto(msg, addr)

	def receive_msg(self):
		response, addr = self.s.recvfrom(2048)
		if isinstance(response, bytes):
			response = json.loads(response.decode("utf-8"))
		return (response, addr)
	
	def send_topology_update(self):
		# Sends a TOPOLOGY_UPDATE message to the controller.			
		live_neighbors = [int(key) for key in self.neighbors if self.neighbors[key]["active"] == True]
		# change live neighbor to a list of active neighbor id.
		request = {"id":self.id, "signal":"TOPOLOGY_UPDATE",  "live_neighbors":live_neighbors} 
		addr = (self.con_hostname, self.con_port)
		self.send_msg(request, addr)	


	@threaded(daemon=False)
	def receive(self):
		logging.warning("Listening to responses.\n")
		while True:	
			#receive data from controller
			response, addr = self.receive_msg()
			signal = response.get("signal")
			# This is a signal from controller
			if signal == "REGISTER_RESPONSE":
				logging.warning("GET REGISTER_RESPONSE message")
				self.neighbors = response.get("neighbors") # a dict of this switch's neighbors
				# upon receive REGISTER_RESPONSE from controller. Send "KEEP_ALIVE"
				# message to each of the active neighbors
				with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
					request = {"signal":"KEEP_ALIVE", "id": self.id}
					
					futures = {executor.submit(self.send_msg, request, 
						(self.neighbors[k].get("host"), self.neighbors[k].get("port"))) 
						for k in self.neighbors 
						if (self.neighbors[k]["active"] == True and k != self.fail_neighbor)}
					concurrent.futures.wait(futures)

			# This is a signal from neighbor switch
			elif signal == "KEEP_ALIVE":
				# if the signal is KEEP_ALIVE, update that neighbors to active
				switch_id = str(response.get("id"))
				print(self.neighbors)
				print(type(switch_id))
				neighbor = self.neighbors[switch_id]
				# Once a switch A receives a KEEP_ALIVE message from a B that is previously considered unreachable, it immediately marks taht neighbor alive and send TOPOLOGY_UPDATE
				if neighbor["active"] == False:
					self.neighbors[switch_id]["active"] = True
					self.neighbors[switch_id]["get_alive_time"] = time.time()
					self.send_topology_update()
				logging.warning("GET KEEP_ALIVE message from switch {0}".format(switch_id))
			elif signal == "ROUTE_UPDATE":
				logging.warning("GET ROUTE_UPDATE message")
				pass
	
	@threaded(daemon=True)
	def check(self):
		def _check(neighbor):
			if (time.time() - neighbor.get("get_alive_time")) >= self.period * 2:
				self.neighbors[neighbor.get("id")]["active"] = False	
				self.send_topology_update()
	
		next_call = time.time()
		while True:
			neighbors = self.neighbors 
			with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
				futures = {executor.submit(_check, neighbors[k]) for k in neighbors}
				concurrent.futures.wait(futures)
			next_call = next_call + self.period * 2
			time.sleep(next_call - time.time())

	@threaded(daemon=True)
	def update(self):
		next_call = time.time()
		# Periodically send a KEEP_ALIVE message to each of the neighboring swtiches 
		while True:
			# Sends a TOPOLOGY_UPDATE message to the controller.			
			self.send_topology_update()
			# Every K seconds, the switch sends a KEEP_ALIVE message to each of the neighboring switches.
			with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
				request = {"signal":"KEEP_ALIVE", "id": self.id}
				futures = {executor.submit(self.send_msg, request, 
					(self.neighbors[k].get("host"), self.neighbors[k].get("port"))) 
					for k in self.neighbors
					if (self.neighbors[k]["active"] == True and k != self.fail_neighbor)}
				concurrent.futures.wait(futures)
			next_call = next_call + self.period
			time.sleep(next_call - time.time())

	def start(self):
		self.init_socket()
		self.connect_host()
		self.receive()
		self.update()
		self.check()



def main():
	argv = sys.argv
	
	if len(argv) < 3:
		print("Enter: <switchID> <controller hostname> <controller port>")
		return 
	else:
		if argv[3] == "-f":
			switch_id, con_host_name, con_port, _, neighbor_id = argv
			switch = Switch(int(switch_id), con_host_name, int(con_port), neighbor_id, True)
			switch.start()
		else:
			print(argv)
			_, switch_id, con_host_name, con_port = argv
			switch = Switch(int(switch_id), con_host_name, int(con_port))
			switch.start()	
if __name__ == "__main__":
	main()

