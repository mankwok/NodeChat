const express = require('express');
const path = require('path')
const compression = require('compression');
const moment = require('moment');

const PORT = process.env.PORT || 8080;

const https = require('https');
const fs = require('fs');
const hskey = fs.readFileSync('ssl.key/server.key');
const hscert = fs.readFileSync('ssl.crt/server.crt')
const options = {
    key: hskey,
    cert: hscert
};

const app = express();
const server = https.createServer(options, app);
const io = require('socket.io').listen(server);

var numUsers = 0;
var numMsg = 0;

app.use(compression());

app.use(express.static(path.join(__dirname, 'public')))
	.get('/', (req, res) => {
		res.render('index.html');
	});

io.sockets.on('connection', (socket) => {
	socket.on('login', (username) => {
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
	socket.on('message', (message) => {
		numMsg++;
		var content = {
			username: socket.username,
			message: message,
			timestamp: moment().format('DD/MM/YYYY kk:mm:ss'),
			numMsg: numMsg
		};
		socket.broadcast.emit('message', content);
	});

	socket.on('typing', () => {
		socket.broadcast.emit('typing', {
			username: socket.username
		});
	});

	socket.on('stop-typing', () => {
		socket.broadcast.emit('stop-typing', {});
	});

	socket.on('disconnect', () => {
		if (typeof (socket.username) != 'undefined' && socket.username && numUsers > 0) {
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

console.log("Server listening at https://localhost:" + PORT);
server.listen(PORT);
