import socket 
import sys
import json
import time

# TODO
# 1. write switch as class
# 2. send KEEP_ALIVE, TOPOLOGY_UPDATE requst periodically
# 3. log the request
CONTROLLER_PORT = 8000
CONTROLLER_HOST = "localhost"
SWITCH_HOST = "localhost"

def main():
	argv = sys.argv
	
	if len(argv) < 3:
		print("Enter: <switchID> <controller hostname> <controller port>")
		return 
	else:
		if argv[3] == "-f":
			swtich()
			switch_id, con_host_name, con_port, _, neighbor_id = argv
			switch(switch_id, con_host_name, con_port, neighbor_id)
		else:
			print argv
			_, switch_id, con_host_name, con_port = argv
			switch(int(switch_id), con_host_name, con_port)

# controller has its own hostname and port name.
# switch also has its own hostname and port name. 

def switch(switch_id, con_host_name, con_port, neighbor_id=None):
	# If we have neighbor_id, we are simulating link failure.
	
	try:
		s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
	except socket.error:
		print("Failed to create socket")
		sys.exit()
	
	SWITCH_PORT = 8000 + switch_id	

	# Bind to self host and port to wait for information from others.
	# Either other switch or controller.
	try:
		s.bind((SWITCH_HOST, SWITCH_PORT))
	except socket.error, msg:
		print("Bind failed. Error Code : " + str(msg[0]) + "Message " + msg[1])


	# When swtich is initialized, send REGISTER_REQUEST message to controller.
	msg = {"signal":"REGISTER_REQUEST", "id": switch_id}
	s.sendto(json.dumps(msg).encode(), (CONTROLLER_HOST, CONTROLLER_PORT))
	neighbors = {}
	while True:	
		#receive data from controller
		print neighbors
		response, addr = s.recvfrom(2048)
		response = json.loads(response.decode("utf-8"))
		signal = response.get("signal")
		# This is a signal from controller
		if signal == "REGISTER_RESPONSE":
			# sends a "KEEP_ALIVE" message to each of the active neightbors
			# using host/port info provided in the response
			# This is a dict of dict, {switch_id: {active:bool, host:str, port:int} .. }
			neighbors = response.get("neighbors")
			for neighbor_id in neighbors:
				neighbor = neighbors[neighbor_id]
				active = neighbor.get("active")
				if active:
					addr = (neighbor.get('host'), neighbor.get('port'))
					request = {"signal":"KEEP_ALIVE", "id": neighbor_id}
					s.sendto(json.dumps(request).encode(), addr)
		elif signal == "KEEP_ALIVE":
			# if the signal is KEEP_ALIVE, update that neighbors to active
			switch_id = response.get("id")	
			neighbors[switch_id]["active"] = True
		# Every k seconds, send to KEEP_ALIVE to each of the neighboring switches.
			
if __name__ == "__main__":
	main()

