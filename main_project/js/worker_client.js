/*
 * Author: Meng-Han Wu
 * Record workers' events.
*/
var socket;
$(document).ready(function() {
	socket = io("https://crowd.ecn.purdue.edu", {path:"/10/socket.io"});
	var myplayer = videojs("myplayer");
	myplayer.panorama({
		clickAndDrag: true,
	});

	var d = new Date();
	var initStatus = getInitStatus();
	var startTime = d.getTime();
	var eventRecords = [];
	// Send initial status to requester.
	socket.emit("init_status", initStatus);

	recordEvent(eventRecords);
	//requestHelp(socket);
});

// Worker makes a request to requeter for help.
function requestHelp(socket) {
	$("#help_request").on("click", function(evt) {
		evt.preventDefault();
		socket.emit("worker_request_help");	
		alert("Send help request to requester");
		$("#help_request").addClass("disabled");
		$("#help_request").off("click");
	});
}

// Record all workers event on the browser.
function recordEvent(eventRecords) {
	var d = new Date();	
	var startTime = d.getTime();
	
	var mouseEvents = ["click", "dbclick", "mousemove", "mouseup", "mousedown", 
		"mouseover", "mouseout"];
	var keyBoardEvents = ["keydown", "keyup"];
	var htmlEvents = ["load", "unload", "abort", "error", "select", "change", 
		"submit", "reset", "focus", "blur", "resize", "scroll"];
	var events = mouseEvents.concat(keyBoardEvents, htmlEvents);

	events.forEach(function(evt) {
		$(window).on(evt, record);	
	});

	function record(evt) {
		var v = new Date();
		var eventTime = v.getTime();
		var delay = eventTime - startTime;
		var eventName = evt.type;
		var args = "";

		// Prevent intensely update for mousemove.
		if (delay < 30 && eventName == "mousemove") {
			return;		
		}

		if (mouseEvents.indexOf(eventName) >= 0) {
			args = {x: evt.clientX, y:evt.clientY};
		}
		else if (keyBoardEvents.indexOf(eventName) >= 0) {
			args = evt.key;
		} 
		else if (htmlEvents.indexOf(eventName) >= 0){ 
			if (eventName == "scroll") {
				var scrollTop = $(window).scrollTop();
				var scrollLeft = $(window).scrollLeft();
				args = {x:scrollLeft, y:scrollTop};
			}
			else if (eventName == "resize") {
				var width = $(window).width;
				var height = $(window).height;
				args = {x:width, y:height};
			}
			else {
				args = "";	
			}
		} 
		else {
			args = "Unknown event";	
		}
		var action = {delay:delay, eventName:eventName, args:args, xpath: Xpath.getPathTo(evt.target)}
		var data = JSON.stringify(action);
		socket.emit("worker_action", data);
		startTime = eventTime;
		//console.log(eventRecords.length);
	}
}


/* Get the initial status of client */
function getInitStatus() {
	var init_status = {};
	var target = $(window);
	init_status["width"] = target.width();
	init_status["height"] = target.height();
	init_status["mouse_pos"] = {x:0, y:0};
	//	target.on("mouseover", function(evt) {
	//		init_status["mouse_pos"] = [evt.clientX, evt.clientY];		
	//	});
	return init_status;
}

function getHelpFromRequester() {
	//socket.on("")
}

