var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var path = require('path');

var PORT = 8010;

app.use(express.static(path.join(__dirname)));

app.get('/worker', function(req, res) {
	res.sendFile(__dirname + '/worker.html');
});

app.get('/requester', function(req, res) {
	res.sendFile(__dirname + '/requester.html');
});


io.on('connection', function(socket) {
	socket.broadcast.emit('user connected');
	
	
	socket.on('disconnect', function() {
		console.log('user disconnected');	
	});
	
	socket.on('worker_action', function(msg) {
		console.log(msg);
		console.log(msg.length);
		io.emit('requester', msg);
	});


});

http.listen(PORT, function() {
	console.log('listening on *: ' + PORT);	
})
