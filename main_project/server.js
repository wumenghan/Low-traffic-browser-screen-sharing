/*
 * Author: Meng-Han Wu
 * Server code to for connecting worker and requester
 *
 */

var express = require("express");
var bodyParser = require('body-parser')
var app = express();
var http = require("http").Server(app);
var io = require("socket.io")(http);
var path = require("path");
var fs = require('fs');

var PORT = 8010;


// app.set('views', 'html')
// app.set('view engine', 'pug')

// use body-parser to grab info from POST
app.use(bodyParser.urlencoded({limit: '10mb', extended: true, parameterLimit: 1000000}))
app.use(bodyParser.json({limit: '10mb'}))

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

app.get("/completedTasks", function(req, res) {
	fs.readdir('./json', function(err, filenames) {
		if (err) {
			console.log(err)
			return;
		}
		let data = filenames.map(getIdsByEventLog)
		res.json(data)
	})
});

app.post('/loadEvents', function(req, res) {
	let taskid = req.body.taskid;
	let workerid = req.body.workerid;
	res.json(JSON.parse(fs.readFileSync(getEventLogName(taskid, workerid), 'utf8')))
})

app.post('/saveEvents', function(req, res) {
	let taskid = req.body.taskid;
	let workerid = req.body.workerid;
	let eventQueue = req.body.eventQueue;
	fs.writeFile(getEventLogName(taskid, workerid), JSON.stringify({eventQueue: eventQueue}), 'utf8', function() {
		res.json('ok')
	});
})

function getEventLogName(taskid, workerid) {
	return './json/event_log_task'+taskid+'_worker'+workerid+'.json';
}

function getIdsByEventLog(filename) {
	let match = filename.match(/event_log_task(\d+)_worker(\d+).json/)
	return {taskid: match[1], workerid: match[2]}
}

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
	
	// socket.on("worker_request_help", function(msg) {
	// 	console.log("worker ask for help");	
	// });

	socket.on('worker_notify_save', function(msg) {
		socket.emit('requester_notify_save', msg)
	})

});

http.listen(PORT, function() {
	console.log("listening on *: " + PORT);	
})
