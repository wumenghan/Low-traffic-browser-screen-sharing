/*
	1. Event happened
	2. Store event 
	3. Send event to server
	all mouse events: https://stackoverflow.com/questions/7439570/how-do-you-log-all-events-fired-by-an-element-in-jquery
*/
$(document).ready(function() {
	var socket = io("https://crowd.ecn.purdue.edu", {path:"/10/socket.io"});
	var myplayer = videojs("myplayer");
	myplayer.panorama({
		clickAndDrag: true,
	});

	var d = new Date();
	var initStatus = getInitStatus();
	var startTime = d.getTime();
	var eventRecord = [];
	recordEvent(eventRecord);
	socket.emit("init_status", initStatus);
	setInterval(function() {
		socket.emit("worker_action", eventRecord)}
	, 1000);
	requestHelp(socket);
});

function requestHelp(socket) {
	$("#help_request").on("click", function(evt) {
		evt.preventDefault();
		socket.emit("worker_request_help");	
		alert("Send help request to requester");
		$("#help_request").addClass("disabled");
		$("#help_request").off("click");
	});
}

function recordEvent(eventRecord) {
	var d = new Date();	
	var startTime = d.getTime();
	
	var mouseEvents = ["click", "dbclick", "mousemove", "mouseup", "mousedown", 
		"mouseover", "mouseout"];
	var keyBoardEvents = ["keydown", "keyup"];
	var htmlEvents = ["load", "unload", "abort", "error", "select", "change", 
		"submit", "reset", "focus", "blur", "resize", "scroll"];
	var events = mouseEvent.concat(keyBoardEvent, htmlEvents);

	events.forEach(function(evt) {
		$(window).on(evt, record);	
	});

	function record(evt) {
		var v = new Date();
		var eventTime = v.getTime();
		var delay = eventTime - startTime;
		var eventName = evt.type;
		var args = "";
		if (mouseEvent.indexOf(evt) >= 0) {
			args = {x: evt.clientX, y:evt.clientY};
		}
		else if (keyBoardEvent.indexOf(evt) >= 0) {
			args = evt.key;
		} 
		else if (htmlEvents.indexOf(evt) >= 0){ 
			args = evt;
		} else {
			args = "Unknown event";	
		}
		eventRecord.push({delay:delay, eventName:eventName, args:args, xpath: Xpath.getPathTo(evt.target)});	
		startTime = eventTime;
	}
}

/* Get the initial status of client */
function getInitStatus() {
	var init_status = {};
	var target = $(window);
	init_status["width"] = target.width();
	init_status["height"] = target.height();
	init_status["mouse_pos"] = [0, 0];
	target.on("mouseover", function(evt) {
		init_status["mouse_pos"] = [evt.clientX, evt.clientY];		
	});
	return init_status;
}
