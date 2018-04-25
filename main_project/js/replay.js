// replay events
// Author: Gaoping Huang
// Since: March 2018

(function($) {
'use strict';

var url = location.href;
var mode = UrlHelper.searchUrlbyKey(url, 'mode') || 'replay';  // 'replay' || 'realtime';

$(document).ready(function() {
  recordMouseClick();
  if (mode == 'realtime') {
    console.log("In realtime mode..");
    startRealtime();
  } else {
    console.log("In replay mode..");
    startReplay();
  }
});

class EventPlayer {
  constructor() {
    this.eventQueue = [];
    this.socket = null;
    // notice: mousemove is in specialEvents
    this.commonEvents = ["click", "dbclick", "mousemove", "mouseup", "mousedown", 
                         "mouseover", "mouseout", "keydown", "keyup"];
    this.specialEvents = {
      resize: (element, args) => {
        window.resizeTo(args.x, args.y);
      },
      scroll: (element, args) => {
        window.scrollTo({left: args.left, top: args.top})
      },
    }
  }

  play(evt) {
    if (evt.eventName === 'mousemove') {
        Cursor.moveTo(evt.args.x, evt.args.y);
    }
    
    if (evt.eventName in this.specialEvents) {
      console.log(evt.eventName)
      this.specialEvents[evt.eventName](document.documentElement, evt.args);
    }
    else if (this.commonEvents.indexOf(evt.eventName) !== -1) {
      let element = Xpath.getElementByXpath(evt.xpath);
      if (!element) return;
      // console.log(evt.eventName, element, evt.args)
      // console.log(evt.eventName)
      Simulator.simulate(element, evt.eventName, evt.args);
    } else {
      console.log(evt.eventName, 'is not supported yet');
    }    
  }
}

class Realtime extends EventPlayer {
  constructor() {
    super()
  }

  start() {
    Cursor.createCursor();
    this.initSocket();
    this.syncScreenSize();
    this.watch();
  }

  initSocket() {
    this.socket = io(window.location.host, {path: UrlHelper.url_for("/socket.io")})
    // console.log(window.location.host)
  }

  syncScreenSize() {
    // fetch screensize from worker
  }

  watch() {
    let self = this;

    this.socket.on('requester', function(evt) {
      if (evt) {
        self.playEvent(evt);
        self.eventQueue.push(evt);
      }
    });

    this.socket.on('worker_init_status', function(msg) {
      if (msg.taskid === UrlHelper.taskid) {
        location.reload();
      }
    });

    this.socket.on('saveEvents', function(msg) {
      self.saveEvents();
    })
  }

  playEvent(evt) {
    evt = typeof evt === 'string' ? JSON.parse(evt) : evt
    super.play(evt);
  }

  saveEvents() {
    // TODO
  }

}


class Replay extends EventPlayer {
  constructor() {
    super();
  }

  start() {
    Cursor.createCursor();
    this.initSocket();
    // FIXME: async
    this.loadEvents();
    this.playEvent();
  }

  initSocket() {
    this.socket = io(window.location.host, {path: UrlHelper.url_for("/socket.io")})
    // console.log(window.location.host)
  }

  loadEvents() {
    // TODO: load via socket
    this.eventQueue = loadCommands();
  }

  playEvent() {
    let self = this;
    let evt;
    do {
      if (this.eventQueue.length === 0) return;
      
      evt = this.eventQueue.shift();  // get first valid event from the Queue
    } while (!evt || typeof evt.delay === 'undefined' || !evt.eventName)

    setTimeout(function() {
      self.play(evt);

      // call the rest eventQueue
      self.playEvent();
    }, evt.delay);
  }

}

function startRealtime() {
  const realtime = new Realtime();
  realtime.start();
}

function startReplay() {
  const replay = new Replay();
  replay.start();
}



function loadCommands() {
  // TODO: load from json
  // TODO: load from server API
  var commands = [
    // {
    //   delay: 1000,
    //   eventName: 'resize',
    //   args: {width: 1000, height: 800}
    // },
    // {
    //   delay: 2000,
    //   eventName: 'resize',
    //   args: {width: 800, height: 600}
    // },
    {
      delay: 200,
      eventName: 'mousemove',
      args: {x: 65 , y: 58},
    },
    {
      delay: 500,
      eventName: 'click',
      args: {x: 65 , y: 58},
      xpath: 'id("first-btn")'
    },
    {
      delay: 200,
      eventName: 'mousemove',
      args: {x: 206 , y: 42},
    },
    {
      delay: 1000,
      eventName: 'click',
      args: {x: 206 , y: 42},
      xpath: 'BODY/P[1]/BUTTON[1]'
    },
    {
      delay: 2000,
      eventName: 'mousemove',
      args: {x: 467 , y: 357},
    },
    {
      delay: 3000,
      eventName: 'mousedown',
      args: {x: 467 , y: 357},
      xpath: 'id("myplayer")/CANVAS[1]'
    },
    {
      delay: 100,
      eventName: 'mouseup',
      args: {x: 467 , y: 357},
      xpath: 'id("myplayer")/CANVAS[1]'
    },
    {
      delay: 2000,
      eventName: 'mousemove',
      args: {x: 252 , y: 434},
    },
    {
      delay: 100,
      eventName: 'mousedown',
      args: {x: 252 , y: 434},
      xpath: 'id("myplayer")/CANVAS[1]'
    },
    {
      delay: 100,
      eventName: 'mouseup',
      args: {x: 252 , y: 434},
      xpath: 'id("myplayer")/CANVAS[1]'
    },
    // {
    //   delay: 2000,
    //   eventName: 'click',
    //   args: {x: 492 , y: 253},
    //   xpath: 'id("second-p")/BUTTON[2]'
    // },
  ];
  return commands;
}


function recordMouseClick() {
  $("body").on('click', function(evt) {
    console.log('clicked at', evt.clientX, evt.clientY, 'xpath:', Xpath.getPathTo(evt.target));

    // alert('clicked at'+ evt.clientX+ evt.clientY);
  })
  $("#first-btn").on('click', function() {
    // alert('clicked at me')
  })
}


})(jQuery);
