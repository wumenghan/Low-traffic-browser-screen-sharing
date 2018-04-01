

(function($) {


// TODO: determine mode
var mode = 'replay' || 'realtime';

var specialHandlers = {
  'resize': resizeHandler,
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
      delay: 2000,
      eventName: 'click',
      args: {pointerX: 65 , pointerY: 58},
      xpath: 'id("first-btn")'
    },
    {
      delay: 2000,
      eventName: 'click',
      args: {pointerX: 206 , pointerY: 42},
      xpath: 'BODY/P[1]/BUTTON[1]'
    },
    {
      delay: 2000,
      eventName: 'click',
      args: {pointerX: 117 , pointerY: 157},
      xpath: 'id("second-p")/A[1]'
    },
    {
      delay: 2000,
      eventName: 'click',
      args: {pointerX: 492 , pointerY: 253},
      xpath: 'id("second-p")/BUTTON[2]'
    },
  ];
  return commands;
}

function playCommand(commands) {
  let cmd;
  while (true) {
    if (commands.length === 0) return;
    
    cmd = commands.shift();  // get first command
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
      simulate(getElementByXpath(xpath), eventName, args);
    }

    // call the rest commands
    playCommand(commands);
  }, delay);
}

function resizeHandler(element, args) {
  window.resizeTo(args.width, args.height);
}

function recordMouseClick() {
  $("body").on('click', function(evt) {
    console.log('clicked at', evt.clientX, evt.clientY, 'xpath:', getPathTo(evt.target));

    // alert('clicked at'+ evt.clientX+ evt.clientY);
  })
  $("#first-btn").on('click', function() {
    // alert('clicked at me')
  })
}


})(jQuery);
