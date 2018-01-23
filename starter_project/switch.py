#!/usr/bin/evn python
# -*- coding: utf-8 -*-
"""
	switch process:
		1. Each switch process is provide with its own id, as well as 
		hostname, port number that controller process runs on as command line 
		arguments.
		2. When switch join system, it contacts the controller with a 
		REGISTER_REQUEST, along with its id. The controller learns the 
		host/port information of the switch from this message.
		3. On receiving a REGISTER_RESPONSE, a swtich immediately sends a 
		"KEEP-ALIVE" message of each of the active neighbors (using the 
		host/port information provided in the response.)
		If other node receive a "KEEP-ALIVE" message from A, it marks A as an
		active neighbor, and learns the host/posrt infor for Switch A.
		4. All switches periodicaly send KEEP_ALIVE messages to each other.
	Each switch takes the following operations:
	1. Every K seconds, send KEEP_ALIVE message of each of the neighboring switches.
	2. Every K seconds, send a TOPOLOGY_UPDATE to controller. This message should 
		inlude a set of live neighbors of thatt swtich.
"""

import socket 
import sys

def main():
	try:
		s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
	except socket.error:
		print "Failed to create socket"
		sys.exit()

	host = "localhost"
	port = 8888

	while True:
		msg = raw_input("Enter message to send : ")

		try:
			# Set the whole thing
			s.sendto(msg, (host, port))

			#receive data from client
			d = s.recvfrom(1024)
			reply = d[0]
			addr = d[1]
			print "Server reply : " + reply
			print addr
		except socket.error, msg:
			print 'Error Code : ' + str(msg[0]) + ' Message ' + msg[1]
			sys.exit()

if __name__ == "__main__":
	main()

