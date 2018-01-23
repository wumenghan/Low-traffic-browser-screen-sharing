#!/usr/bin/evn python
# -*- coding: utf-8 -*-
"""
	udp socket client
"""

import socket 
import sys
import json

def main():
	try:
		s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
	except socket.error:
		print("Failed to create socket")
		sys.exit()

	host = "localhost"
	port = 8000

	while True:
		#msg = raw_input("Enter message to send : ")

		try:
			# Set the whole thing
			msg = {"host":"localhost", "port":8001, "signal":"REGISTER_REQUEST"}
			msg = json.dumps(msg).encode()	
			s.sendto(msg, (host, port))

			#receive data from client
			d = s.recvfrom(1024)
			reply = d[0]
			addr = d[1]
			#print "Server reply : " + reply
			#print addr
		except socket.error, msg:
			#print 'Error Code : ' + str(msg[0]) + ' Message ' + msg[1]
			sys.exit()

if __name__ == "__main__":
	main()

