#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
UDP tutorial
credits: http://www.binarytides.com/programming-udp-sockets-in-python/
"""
__author__ = "Meng-Han Wu"
__version__ = "0.1.0"
__license__ = "MIT"

import socket
import sys
HOST = ''
port = 8888

def main():
	try:
		s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)	
		print "Socket created"
	except socket.error, msg:
		print "Failed to create socket. Effor Code :" + str(msg[0]) + 'Message ' + msg[1]
		sys.exit()
	
	# Bind socket to local host and port
	try:
		s.bind((HOST, PORT))
	except socket.error, msg:
		print 'Bind failed. Error Code : ' + str(msg[0]) + ' Message ' + msg[1]
		sys.exit()
	print "Socket bind Complete"

	s.bind(("", port))
	print "Waiting on port: ", port
	while True:
		# receive data from client (data, addr)
		data, addr = s.recvfrom(1024)
		if not data:
			break
		reply = "OK... " + data
		s.sendto(reply, addr)
		print 'Message[' + addr[0] + ':' + str(addr[1]) + '] - ' + data.strip()
	s.close()

if __name__ == "__main__":
	main()

