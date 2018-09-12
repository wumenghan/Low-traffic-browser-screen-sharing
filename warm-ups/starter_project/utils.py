
import heapq
import sys
import logging

FORMAT = '[%(levelname)s] %(message)s'
VERBOSE_LEVEL = logging.INFO
logging.basicConfig(stream=sys.stdout, level=VERBOSE_LEVEL, format=FORMAT)
logger = logging.getLogger(__name__)

def compute_path_for_all_switches(size, topology, active_switches):
    computed_pairs = {}
    for src in active_switches:
        for dest in active_switches:
            if src != dest and ((src, dest) not in computed_pairs and (dest, src) not in computed_pairs):
                compute_path(topology, src, dest, computed_pairs)
    # print(computed_pairs)
    return computed_pairs

def compute_path(topology, src, dest, computed_pairs):
    """Find the path with highest bandwidth."""
    hp = [(float('-inf'), src, [])]
    seen = set()
    while hp:
        (bandwidth, id1, path) = heapq.heappop(hp)
        bandwidth = -bandwidth
        if id1 not in seen:
            seen.add(id1)
            path = path + [id1]
            if bandwidth and src != id1 and ((src, id1) not in computed_pairs and (id1, src) not in computed_pairs):
                computed_pairs[(src, id1)] = (bandwidth, path)
            if id1 == dest:
                return

            for id2, link in enumerate(topology[id1-1]):
                if link and link['connected']:
                    id2 = id2 + 1
                    if id2 not in seen:  # can append duplicate node as long as it is not seen
                        heapq.heappush(hp, (-min(bandwidth, link['bandwidth']), id2, path))
    computed_pairs[(src, dest)] = []
