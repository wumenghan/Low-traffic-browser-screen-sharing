#!/usr/bin/env python3
"""
Controller for UDP connection
Author: Gaoping Huang
Since: 1/22/2018
"""

import socket
import json
import threading
import time
import datetime
import logging
import sys

UDP_HOST = 'localhost'   # or socket.gethostname()
UDP_PORT = 8000
VERBOSE_LEVEL = logging.DEBUG
logging.basicConfig(stream=sys.stdout, level=VERBOSE_LEVEL)
K = 5
M = 3

class Controller(object):
    def __init__(self, host, port, config_filename):
        self.host = host
        self.port = port
        self.config_filename = config_filename
        self.sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)  # UDP
        self.sock.bind((host, port))
        self.total_switch_num = 0
        self.switches = {}   # switch_id: status_dict
        # For example, status_dict ==>   {'active': bool, 'host': str, 'port': int, 'utime': int}
        self.topology = [[]]  # 2D matrix to represent the link graph, each cell: (bandwith, delay, connected)
        self.parse_config()

    def build_link(self, id1, id2, bandwith, delay):
        self.topology[id1-1][id2-1] = {'bandwith': bandwith, 'delay': delay, 'connected': True}
        self.topology[id2-1][id1-1] = {'bandwith': bandwith, 'delay': delay, 'connected': True}

    def update_link(self, id1, id2, connected):
        self.topology[id1-1][id2-1]['connected'] = connected
        self.topology[id2-1][id1-1]['connected'] = connected

    def get_neighbor_ids(self, switch_id):
        for _id, link in enumerate(self.topology[switch_id-1]):
            if link:  # no matter if it is connected or not
                yield _id + 1

    def parse_config(self):
        with open(self.config_filename, 'r') as config:
            for line in config.readlines():
                row = line.strip().split(' ')
                row = [int(x) for x in row]
                if len(row) == 1:
                    self.total_switch_num = row[0]
                    self.topology = [[0]*self.total_switch_num for _ in range(self.total_switch_num)]
                elif len(row) == 4:
                    id1, id2, bandwith, delay = row
                    self.build_link(id1, id2, bandwith, delay)
            self.switches = {_id: {'active': False} for _id in range(1, self.total_switch_num+1)}

    def mysend(self, data, addr):
        self.sock.sendto(json.dumps(data).encode(), addr)

    def register_switch(self, req, addr):
        switch_id = req['id']
        logging.info('Switch id {} joins the network from {}:{}\n'.format(switch_id, addr[0], addr[1]))
        self.switches[switch_id] = {'active': True, 'host': addr[0], 'port': addr[1]}
        neighbor_ids = self.get_neighbor_ids(switch_id)
        neighbors = {_id: self.switches[_id] for _id in neighbor_ids}  # switch_id: status_dict
        logging.debug('New status of all switches: %s', self.switches)
        logging.debug('Neighbors of switch id {}: %s \n'.format(switch_id), neighbors)
        res = {'signal': 'REGISTER_RESPONSE', 'neighbors': neighbors}
        self.mysend(res, addr)

        if self.are_all_switches_active():
            self.flush_topology(addr)

    def are_all_switches_active(self):
        return all((status['active'] for _id, status in self.switches.items()))

    def flush_topology(self, addr):
        # broadcast new topology to all switches
        print('flush topology')

    def update_topology(self, req, addr):
        '''check if each link is updated'''
        switch_id = req['id']
        old_neighbor_ids = set(self.get_neighbor_ids(switch_id))
        old_links = set(_id for _id, link in enumerate(self.topology[switch_id-1]) if link[2])
        new_links = set(req['live_neighbors'])
        if old_links != new_links:
            print(old_links, new_links)
            # new link connection
            for _id in (new_links - old_links):
                self.update_link(switch_id, _id, True)
            # fail link connection
            for _id in (old_links - new_links):
                self.update_link(switch_id, _id, False)
            self.flush_topology(addr)

    def timer(self, period=K):
        # credit: https://stackoverflow.com/a/18180189/4246348
        next_call = time.time()
        while True:
            # print(datetime.datetime.now())
            # check status of each switch
            self.check_status()
            next_call += period
            time.sleep(next_call - time.time())

    def check_status(self):
        # check if a switch has no TOPOLOGY_UPDATE for M*K seconds
        now = time.time()
        has_dead = False
        for _id, status in self.switches.items():
            if status['active'] and now - status.get('utime', now) > M*K:
                self.switches[_id] = {'active': False}
                has_dead = True
        if has_dead:
            logging.info('some switch down')
            self.flush_topology()
        else:
            logging.debug('all status ok')

    def watch(self):
        logging.info('Starting controller at {}:{}...'.format(self.host, self.port))
        # start timer
        timer_thread = threading.Thread(target=self.timer)
        timer_thread.daemon = True
        timer_thread.start()

        while True:
            req, addr = self.sock.recvfrom(2048)  # buffer size
            req = json.loads(req.decode())
            signal = req.get('signal')
            if signal == 'REGISTER_REQUEST':
                self.register_switch(req, addr)
            elif signal == 'TOPOLOGY_UPDATE':
                self.update_topology(req, addr)
            else:
                logging.warn('Unknown signal: %s', signal)


def compute_path_for_all_switches(size, topology):
    bandwith = [[None]*size for _ in range(size)]
    for source in range(size):
        for target in range(size):
            if not bandwith[source][target]:
                compute_path(topology, source, target, bandwith)


def compute_path(topology, source, target, bandwith):
    pass


if __name__ == '__main__':
    ctrl = Controller(UDP_HOST, UDP_PORT, './config.txt')
    # ctrl.watch()
    ctrl.register_switch({'id': 1}, ('localhost', 8001))
    ctrl.register_switch({'id': 2}, ('localhost', 8002))
    ctrl.register_switch({'id': 3}, ('localhost', 8003))
    ctrl.register_switch({'id': 4}, ('localhost', 8004))
    ctrl.register_switch({'id': 5}, ('localhost', 8005))
    ctrl.register_switch({'id': 6}, ('localhost', 8006))

