// replay events
// Author: Gaoping Huang
// Since: March 2018

(function($) {
  'use strict';

  var url = location.href;
var mode = UrlHelper.searchUrlbyKey(url, 'mode') || 'replay';  // 'replay' || 'realtime';

$(document).ready(function() {
  // recordMouseClick();  // for debug
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
    this.scrollOffset = {left:0, top:0};
    // notice: mousemove is in specialEvents
    this.commonEvents = ["click", "dbclick", "mousemove", "mouseup", "mousedown", 
    "mouseover", "mouseout", "keydown", "keyup"];
    this.specialEvents = {
      resize: (element, args) => {
        window.resizeTo(args.x, args.y);
      },
      scroll: (element, args) => {
        window.scrollTo({left: args.left, top: args.top})
        this.scrollOffset = args;
      },
    }
  }

  initSocket() {
    this.socket = io(window.location.host, {path: UrlHelper.url_for("/socket.io")})
    // console.log(window.location.host)
  }

  play(evt) {
    if (evt.eventName === 'mousemove') {
      Cursor.moveTo(evt.args.x + this.scrollOffset.left, evt.args.y + this.scrollOffset.top);
    }
    
    if (evt.eventName in this.specialEvents) {
      console.log(evt.eventName)
      this.specialEvents[evt.eventName](document.documentElement, evt.args);
    }
    else if (this.commonEvents.indexOf(evt.eventName) !== -1) {
      let element = Xpath.getElementByXpath(evt.xpath);
      // let element = document.elementFromPoint(evt.args.x, evt.args.y)
      // if (evt.eventName === 'click') {
      //   console.log(evt.eventName, element, evt.args)
      // }
      if (!element) return;
      // console.log(evt.eventName)
      Simulator.simulate(element, evt.eventName, evt.args);
    } else {
      console.log(evt.eventName, 'is not supported yet');
    }    
  }

  showCompletionCode() {
    $('#completion-code').html(`Completion Code: <strong>t${UrlHelper.taskid}w${UrlHelper.workerid}s100 </strong>`)
  }
}

class Realtime extends EventPlayer {
  constructor() {
    super()
  }

  start() {
    Cursor.createCursor();
    this.saveInitialStatus();
    this.initSocket();
    this.watch();
  }

  saveInitialStatus() {
    const offset = 80;
    let initStatus = {
      delay: 0,
      eventName: 'resize',
      // add offset because the browser tab is taller than individually opened window 
      args: {x: window.innerWidth, y: window.innerHeight + offset}
    }
    this.eventQueue.push(JSON.stringify(initStatus))
  }

  watch() {
    let self = this;

    this.socket.on('requester', function(msg) {
      msg = typeof msg === 'string' ? JSON.parse(msg) : msg
      if (UrlHelper.areEqualIds(msg.ids)) {
        self.playEvent(msg.evt);
        self.eventQueue.push(JSON.stringify(msg.evt));
      }
    });

    this.socket.on('worker_init_status', function(msg) {
      if (UrlHelper.areEqualIds(msg.ids)) {
        location.reload();
      }
    });

    $('#save-events').on('click', function() {
      // show completion code
      self.showCompletionCode();
      self.saveEvents();
    })

  }

  playEvent(evt) {
    evt = typeof evt === 'string' ? JSON.parse(evt) : evt
    super.play(evt);
  }

  saveEvents() {
    let self = this;
    $.ajax({
      method: 'POST',
      url: UrlHelper.url_for('saveEvents'),
      data: {taskid: UrlHelper.taskid, workerid: UrlHelper.workerid, eventQueue: self.eventQueue},
      dataType: 'json'
    }).done(function(data) {
      console.log(data)
    }).catch(function(err) {
      console.error(err)
    })
  }

}


class Replay extends EventPlayer {
  constructor() {
    super();
  }

  start() {
    let self = this;
    Cursor.createCursor();
    this.handleSaveEvents();
    // this.initSocket();

    this.loadEvents().done((data) => {
      self.eventQueue = data.eventQueue;
      self.playEvent();
    }).catch((err) => {
      console.error(err)
    });
  }

  loadEvents() {
    return $.ajax({
      method: 'POST',
      url: UrlHelper.url_for('loadEvents'),
      data: {taskid: UrlHelper.taskid, workerid: UrlHelper.workerid},
      dataType: 'json'
    })
  }

  // play event recursively, one by one in the queue
  playEvent() {
    let self = this;
    let evt;
    do {
      if (this.eventQueue.length === 0) return;
      
      evt = this.eventQueue.shift();  // get first valid event from the Queue
      evt = typeof evt === 'string' ? JSON.parse(evt) : evt
    } while (!evt || typeof evt.delay === 'undefined' || !evt.eventName)

    setTimeout(function() {
      self.play(evt);

      // call the rest eventQueue
      self.playEvent();
    }, evt.delay);
  }

  handleSaveEvents() {
    $('#save-events').on('click', function() {
      self.showCompletionCode();
    })
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


// for debug
function recordMouseClick() {
  $("body").on('click', function(evt) {
    console.log('clicked at', evt.clientX, evt.clientY, 'xpath:', Xpath.getPathTo(evt.target));
  })
}


})(jQuery);
