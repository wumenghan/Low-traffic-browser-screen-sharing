#!/usr/bin/env python3
"""
Controller for UDP connection
Author: Gaoping Huang
Since: 1/22/2018
"""

import socket
import json
import time
import datetime
import sys
import threading
import concurrent.futures

from utils import compute_path_for_all_switches, logger

UDP_HOST = 'localhost'   # or socket.gethostname()
UDP_PORT = 8000

K = 5
M = 3
NUM_WORKERS = 4

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
        self.topology = [[]]  # 2D matrix to represent the link graph, each cell: (bandwidth, delay, connected)
        self.parse_config()

    def build_link(self, id1, id2, bandwidth, delay):
        self.topology[id1-1][id2-1] = {'bandwidth': bandwidth, 'delay': delay, 'connected': False}
        self.topology[id2-1][id1-1] = {'bandwidth': bandwidth, 'delay': delay, 'connected': False}

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
                    id1, id2, bandwidth, delay = row
                    self.build_link(id1, id2, bandwidth, delay)
            self.switches = {_id: {'active': False} for _id in range(1, self.total_switch_num+1)}

    def mysend(self, data, addr):
        self.sock.sendto(json.dumps(data).encode(), addr)

    def register_switch(self, req, addr):
        switch_id = req['id']
        logger.info('receive REGISTER_REQUEST from switch {} at {}:{}'.format(switch_id, addr[0], addr[1]))
        self.switches[switch_id] = {'active': True, 'host': addr[0], 'port': addr[1]}
        neighbor_ids = self.get_neighbor_ids(switch_id)
        neighbors = {_id: self.switches[_id] for _id in neighbor_ids}  # switch_id: status_dict
        logger.debug('New status of all switches: %s', self.switches)
        logger.debug('Neighbors of switch id {}: %s \n'.format(switch_id), neighbors)
        res = {'signal': 'REGISTER_RESPONSE', 'neighbors': neighbors}
        logger.info('send REGISTER_RESPONSE to switch {}'.format(switch_id))
        logger.info('%s', neighbors)
        self.mysend(res, addr)

        if self.are_all_switches_active():
            self.flush_topology()

    def are_all_switches_active(self):
        return all((status['active'] for _id, status in self.switches.items()))

    def flush_topology(self):
        # broadcast new topology to all switches
        logger.debug('flush topology')
        active_switches = [_id for _id in self.switches if self.switches[_id]['active']]
        logger.debug('active switches: %s', active_switches)
        computed_pairs = compute_path_for_all_switches(self.total_switch_num, self.topology, active_switches)
        # print('computed pairs', computed_pairs)
        with concurrent.futures.ThreadPoolExecutor(max_workers=NUM_WORKERS) as executor:
            tasks = {executor.submit(self.do_flush, src, active_switches, computed_pairs) for src in active_switches}
            concurrent.futures.wait(tasks)

    def do_flush(self, src, active_switches, computed_pairs):
        # print('do flush')
        data = []
        for dest in active_switches:
            if src == dest:
                continue
            if (src, dest) in computed_pairs:
                if computed_pairs[(src, dest)]:
                    (bandwidth, path) = computed_pairs[(src, dest)]
                    data.append((dest, bandwidth, path[1]))
                else:
                    data.append((dest, '-', '-'))
            elif (dest, src) in computed_pairs:
                if computed_pairs[(dest, src)]:
                    (bandwidth, path) = computed_pairs[(dest, src)]
                    data.append((dest, bandwidth, path[-2]))
                else:
                    data.append((dest, '-', '-'))
            else:
                logger.warning('unknown (src, dest) pair %s', (src, dest))
        addr = (self.switches[src]['host'], self.switches[src]['port'])
        logger.info('send ROUTE_UPDATE to switch %s: %s', src, data)
        self.mysend({'signal': 'ROUTE_UPDATE', 'route_table': data}, addr)

    def update_topology(self, req, addr):
        '''check if each link has updates'''
        switch_id = req['id']
        self.switches[switch_id]['utime'] = time.time()

        old_neighbor_ids = set(self.get_neighbor_ids(switch_id))
        old_links = {_id+1 for _id, link in enumerate(self.topology[switch_id-1]) \
                     if link and link['connected']}
        new_links = set(req['live_neighbors'])
        logger.debug('receive UPDATE_TOPOLOGY from switch %s', switch_id)
        if old_links != new_links:
            logger.info('UPDATE_TOPOLOGY from switch %s has link updates', switch_id)
            logger.debug('old links %s, new links %s', old_links, new_links)
            # new link connection
            for _id in (new_links - old_links):
                self.update_link(switch_id, _id, True)
                logger.info('link %s-%s is on', switch_id, _id)
            # fail link connection
            for _id in (old_links - new_links):
                self.update_link(switch_id, _id, False)
                logger.info('link %s-%s is down', switch_id, _id)
            self.flush_topology()

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
                for id2 in self.get_neighbor_ids(_id):
                    self.update_link(_id, id2, False)
                logger.info('Switch %s is down', _id)
                has_dead = True
        if has_dead:
            self.flush_topology()
        else:
            logger.debug('all status ok')

    def watch(self):
        logger.info('Starting controller at {}:{}...'.format(self.host, self.port))
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
                logger.warn('Unknown signal: %s', signal)




if __name__ == '__main__':
    ctrl = Controller(UDP_HOST, UDP_PORT, './config.txt')
    ctrl.watch()
    # ctrl.register_switch({'id': 1}, ('localhost', 8001))
    # ctrl.register_switch({'id': 2}, ('localhost', 8002))
    # ctrl.register_switch({'id': 3}, ('localhost', 8003))
    # ctrl.register_switch({'id': 4}, ('localhost', 8004))
    # ctrl.register_switch({'id': 5}, ('localhost', 8005))
    # ctrl.register_switch({'id': 6}, ('localhost', 8006))
    # ctrl.flush_topology()

