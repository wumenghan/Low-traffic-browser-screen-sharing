/*
	1. Event happened
	2. Store event 
	3. Send event to server
	all mouse events: https://stackoverflow.com/questions/7439570/how-do-you-log-all-events-fired-by-an-element-in-jquery
*/
$(document).ready(function() {
	var socket = io('https://crowd.ecn.purdue.edu', {path:'/10/socket.io'});
	var player = videojs('myplayer',function(){ 
		this.panorama({
			clickAndDrag: true
		});
	});	

	var commands = []; // This is a list of command obj;
	player.panorama({
    	clickAndDrag: true,
    	callback: function () {
      player.play();
    }
	});

	var d = new Date();
	var initStatus =  getInitStatus();
	var startTime = d.getTime();
	var eventRecord = [];
	recordEvent(eventRecord);
	//setInterval(socket.emit('worker_action', eventRecord), 1000);
	setInterval( function() {
		socket.emit('worker_action', eventRecord)}
	, 1000);
});


function recordEvent(eventRecord) {
	//	var ojb = {delay:, eventName:, args:, xpath:, eventContent:};
	var d = new Date();	
	var startTime = d.getTime();
	$(window).on('click', record);
	$(window).on('dbclick', record);
	$(window).on('mousemove', record);
	$(window).on('mouseup', record);
	$(window).on('mousedown', record);
	$(window).on('mouseover', record);
	$(window).on('mouseout', record);

	function record(evt) {
		var v = new Date();
		var eventTime = v.getTime();
		var delay = eventTime - startTime;
		var eventName = evt.type;
		var args = {x: evt.clientX, y:evt.clientY};
		eventRecord.push({delay:delay, eventName:eventName, args:args, xpath: getPathTo(evt.target)});	
		startTime = eventTime;
		console.log(eventRecord);
	}
}

/* Get the initial status of client */
function getInitStatus() {
	var init_status = {};
	var target = $(window);
	init_status['width'] = target.width();
	init_status['height'] = target.height();
	target.on('mousemove', function(evt) {
		init_status['mouse_pos'] = [evt.clientX, evt.clientY];		
		//	target.off('mousemove');
	});
	return init_status;
}
