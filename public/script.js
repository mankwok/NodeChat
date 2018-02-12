var loggedIn = false;
var username = '';

const socket = io();

const $divChat = $('#chat');
const $conversation = $('#conversation');
const $inputField = $('#msg');

const $divLogin = $('#login');
const $usernameField = $('#username');

function init() {
	$divChat.hide();
	$usernameField.val('');
}

function cleanInput(input) {
	return $('<div/>').text(input).html();
}

function addMessageElement(msgType, data) {
	if (loggedIn) {
		var $el = $('<li>').addClass(msgType).text(prepareMessage(msgType, data));
		$conversation.append($el);
		window.scrollTo(0, document.body.scrollHeight);
	}
}

function prepareMessage(msgType, data) {
	var message;
	if (msgType == 'self') {
		message = '>' + moment().format('DD/MM/YYYY kk:mm:ss') + ' - ' + username + ' - ' + data;
	} else {
		message = data.timestamp + ' - ';
		if (msgType == 'user-join') {
			message += data.username + ' has joined. (current: ' + data.numUsers + ')';
		} else if (msgType == 'user-left') {
			message += 'The name \'' + data.username + '\' does not exist in the current context. - (current: ' + data.numUsers + ')';
		} else if (msgType == 'logged-in') {
			message += 'Welcome ' + data.username + '. (current: ' + data.numUsers + ')';
		} else if (msgType == 'message') {
			message += data.username + ' - ' + data.message;
		}
		message += ' - (' + data.numMsg + ')';
	}
	return message;
}

function login() {
	username = cleanInput($usernameField.val());
	socket.emit('login', username);
	$divLogin.hide();
	$divChat.show();
	$inputField.focus();
}

socket.on('logged-in', function (data) {
	loggedIn = true;
	addMessageElement('logged-in', data);
});

socket.on('user-join', function (data) {
	addMessageElement('user-join', data);
});

socket.on('user-left', function (data) {
	addMessageElement('user-left', data);
});

socket.on('message', function (data) {
	addMessageElement('message', data);
});

socket.on('reconnect', function () {
	if (loggedIn && username) {
		addMessageElement('self', 'You have been reconnected');
		loggedIn = true;
		socket.emit('login', username);
	}
});

socket.on('reconnect-error', function () {
	if (username) {
		addMessageElement('self', 'Attempt to reconnect has failed');
		loggedIn = false;
	}
});

$usernameField.keyup(function (event) {
	if (event.which == 13) {
		login();
	}
});

$inputField.keyup(function (event) {
	if (event.which == 13) {
		var message = cleanInput($inputField.val());
		if (message) {
			socket.emit('message', message);
			addMessageElement('self', message);
			$inputField.val('');
			$inputField.focus();
		}
	}
});

init();