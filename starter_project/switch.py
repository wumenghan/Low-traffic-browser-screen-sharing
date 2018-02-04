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
	def __init__(self, switch_id, con_hostname, con_port):
		self.id = switch_id
		self.con_hostname = con_hostname
		self.con_port = con_port
		self.port = 8000 + switch_id
		self.host = "localhost"
		self.neighbors = {}
		self.period = 5  # Send update message every 5 seconds.
	
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
		logging.info("Socket init success\n")	

	def connect_host(self):
		msg = {"signal":"REGISTER_REQUEST", "id":self.id}
		self.send_msg(msg, (self.con_hostname, self.con_port))
		logging.info("Send REGISTER_REQUEST to controller\n")

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

	@threaded(daemon=False)
	def receive(self):
		logging.info("Listening to responses.\n")
		while True:	
			#receive data from controller
			response, addr = self.receive_msg()
			signal = response.get("signal")
			# This is a signal from controller
			if signal == "REGISTER_RESPONSE":
				logging.info("GET REGISTER_RESPONSE message")
				self.neighbors = response.get("neighbors") # a dict of this switch's neighbors
				# upon receive REGISTER_RESPONSE from controller. Send "KEEP_ALIVE"
				# message to each of the active neighbors
				with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
					request = {"signal":"KEEP_ALIVE", "id": self.id}
					futures = {executor.submit(self.send_msg, request, 
						(self.neighbors[k].get("host"), self.neighbors[k].get("port"))) 
						for k in self.neighbors if self.neighbors[k]["active"] == True)
					concurrent.futures.wait(futures)

				# Start to periodically
				#self.update.start()
			# This is a signal from neighbor switch
			elif signal == "KEEP_ALIVE":
				logging.info("GET KEEP_ALIVE message")
				# if the signal is KEEP_ALIVE, update that neighbors to active
				switch_id = response.get("id")	
				self.neighbors[switch_id]["active"] = True

	@threaded(daemon=True)
	def update(self):
		next_call = time.time()
		# Periodically send a KEEP_ALIVE message to each of the neighboring swtiches 
		while True:
			# Sends a TOPOLOGY_UPDATE message to the controller.			
			live_neighbors = {k: v for k, v in self.neighbors.items() if v["active"] == True} # get dict of live neighbor
			request = {"signal":"TOPOLOGY_UPDATE",  "live":live_neighbors} 
			addr = (self.con_hostname, self.con_port)
			self.send_msg(request, addr)	

			# Every K seconds, the switch sends a KEEP_ALIVE message to each of the neighboring switches.
			with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
				request = {"signal":"KEEP_ALIVE", "id": self.id}
				futures = {executor.submit(self.send_msg, request, 
					(self.neighbors[k].get("host"), self.neighbors[k].get("port"))) 
					for k in self.neighbors}	
				concurrent.futures.wait(futures)
			next_call = next_call + self.period
			print(next_call - time.time())
			time.sleep(next_call - time.time())

	def start(self):
		self.init_socket()
		self.connect_host()
		self.receive()
		self.update()



def main():
	argv = sys.argv
	
	if len(argv) < 3:
		print("Enter: <switchID> <controller hostname> <controller port>")
		return 
	else:
		if argv[3] == "-f":
			switch_id, con_host_name, con_port, _, neighbor_id = argv
			switch = Switch(switch_id, con_host_name, con_port, neighbor_id)
			switch.start()
		else:
			print(argv)
			_, switch_id, con_host_name, con_port = argv
			switch = Switch(int(switch_id), con_host_name, int(con_port))
			switch.start()	
if __name__ == "__main__":
	main()

