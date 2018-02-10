var express = require('express');
var path = require('path')
var compression = require('compression');
var moment = require('moment');

var PORT = process.env.PORT || 8080;

var app = express();
var server = require('http').Server(app);
var io = require('socket.io').listen(server);

var numUsers = 0;
var numMsg = 0;

app.use(compression());

app.use(express.static(path.join(__dirname, 'public')))
	.get('/', function (req, res) {
		res.render('index.html');
	});

io.sockets.on('connection', function (socket) {
	socket.on('login', function (username) {
		if (username != null && username != '') {
			socket.username = username;
		} else {
			socket.username = 'Anonymous';
		}
		numUsers++;
		var content = {
			username: socket.username,
			timestamp: moment().format('DD/MM/YYYY kk:mm:ss'),
			numUsers: numUsers,
			numMsg: numMsg
		};
		socket.broadcast.emit('user-join', content);
		socket.emit('logged-in', content)
	});
	socket.on('message', function (message) {
		numMsg++;
		var content = {
			username: socket.username,
			message: message,
			timestamp: moment().format('DD/MM/YYYY kk:mm:ss'),
			numMsg: numMsg
		};
		socket.broadcast.emit('message', content);
	});
	socket.on('disconnect', function () {
		if (typeof (socket.username) != 'undefined' && socket.username != null && numUsers > 0) {
			numUsers--;
			var content = {
				username: socket.username,
				timestamp: moment().format('DD/MM/YYYY kk:mm:ss'),
				numUsers: numUsers,
				numMsg: numMsg
			};
			socket.broadcast.emit('user-left', content);
		}
	});
});

console.log("Server listening at http://localhost:" + PORT);
server.listen(PORT);