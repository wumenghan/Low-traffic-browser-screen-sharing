/*
 * Author: Meng-Han Wu
 * Server code to for connecting worker and requester
 *
 */

var express = require("express");
var app = express();
var http = require("http").Server(app);
var io = require("socket.io")(http);
var path = require("path");

var PORT = 8010;


// app.set('views', 'html')
// app.set('view engine', 'pug')


app.use(express.static(path.join(__dirname)));


app.get("/worker", function(req, res) {
	let taskid = req.query.taskid;
	res.sendFile(path.join(__dirname, "html/worker"+taskid+".html"));
});

app.get("/requester", function(req, res) {
	let taskid = req.query.taskid;
	res.sendFile(path.join(__dirname, "html/requester"+taskid+".html"));
	// res.render('requester'+taskid, {title: 'Requester Page'})
});

app.get("/dashboard", function(req, res) {
	res.sendFile(path.join(__dirname, "html/dashboard.html"));
});

app.get("/replay", function(req, res) {
	let taskid = req.query.taskid;
	res.sendFile(path.join(__dirname, "html/replay"+taskid+".html"));
});


io.on("connection", function(socket) {
	socket.broadcast.emit("user connected");
	
	socket.on("disconnect", function() {
		console.log("user disconnected");	
	});	

	socket.on("init_status", function(msg) {
		console.log(msg);
		io.emit("worker_init_status", msg);	
	});

	socket.on("worker_action", function(msg) {
		io.emit("requester", msg);
		// console.log(msg);
	});
	
	socket.on("worker_request_help", function(msg) {
		console.log("worker ask for help");	
	});

});

http.listen(PORT, function() {
	console.log("listening on *: " + PORT);	
})
