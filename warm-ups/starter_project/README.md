# Starter Project:  SDN (Software defined network)

## Partner Contribution
1. Gaoping Huang  (huang679) - controller
2. Meng-Han Wu  (wu784)  - switch

## Demo Instructions

Commands to run:
```bash
$ ./controller.py
# Starting controller at localhost:8000...
$ ./switch.py 1 localhost 8000
# Controller logging:
# Switch id 1 joins the network from 127.0.0.1:8001
$ ./switch.py 2 localhost 8000
$ ./switch.py 3 localhost 8000
$ ./switch.py 4 localhost 8000
$ ./switch.py 5 localhost 8000
$ ./switch.py 6 localhost 8000
# kill switch 2

# restart switch 2 with fail link
$ ./switch.py 2 localhost 8000 -f 5
```