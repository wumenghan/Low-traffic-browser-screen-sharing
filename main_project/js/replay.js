// replay commands
// Author: Gaoping Huang
// Since: March 2018

(function($) {


// TODO: determine mode
var mode = 'replay' || 'realtime';

var specialHandlers = {
  resize: function resizeHandler(element, args) {
    window.resizeTo(args.width, args.height);
  },
  cursorMove: function moveCursor(element, args) {
    Cursor.moveTo(args.x, args.y);
  },
}

$(document).ready(function() {
  recordMouseClick();
  if (mode == 'realtime') {
    // TODO
    console.log("In realtime mode..");
  } else {
    console.log("In replay mode..");
    startReplay();
  }
});

function startReplay() {
  var commands = loadCommands();
  Cursor.createCursor();
  playCommand(commands);
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
      eventName: 'cursorMove',
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
      eventName: 'cursorMove',
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
      eventName: 'cursorMove',
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
      eventName: 'cursorMove',
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

function playCommand(commandQueue) {
  let cmd;
  while (true) {
    if (commandQueue.length === 0) return;
    
    cmd = commandQueue.shift();  // get first command from the Queue
    if (cmd && typeof cmd.delay !== 'undefined' && typeof cmd.eventName !== 'undefined')
      break;
  }
  let delay = cmd.delay;
  let eventName = cmd.eventName;
  let args = cmd.args;
  let xpath = cmd.xpath;

  setTimeout(function() {
    console.log(delay, eventName, args);
    if (eventName in specialHandlers) {
      specialHandlers[eventName](document.documentElement, args);
    }
    else {
      // console.log(xpath, getElementByXpath(xpath))
      Simulator.simulate(Xpath.getElementByXpath(xpath), eventName, args);
    }

    // call the rest commandQueue
    playCommand(commandQueue);
  }, delay);
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
