var loggedIn = false;
var username = '';
var msgStack = [];
var msgStackPosition = 0;
var typing = false;
var lastTypingTime;

const msgStackSize = 10;

const socket = io();

const $divChat = $('#chat');
const $conversation = $('#conversation');
const $inputField = $('#msg');
const $typing = $('#typing');

const $divLogin = $('#login');
const $usernameField = $('#username');

const TYPING_TIMER_LENGTH = 500;

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

function updateTyping() {
	if (loggedIn) {
		if (!typing) {
			typing = true;
			socket.emit('typing');
		}
		lastTypingTime = moment();

		setTimeout(function () {
			var typingTimer = moment();
			var timeDiff = typingTimer - lastTypingTime;
			if (timeDiff >= TYPING_TIMER_LENGTH && typing) {
				socket.emit('stop-typing');
				typing = false;
			}
		}, TYPING_TIMER_LENGTH);
	}
}

function addChatTyping(data) {
	if (loggedIn) {
		$typing.text(data.username + " is typing...");
	}
}

function removeChatTyping() {
	if (loggedIn) {
		$typing.text("");
	}
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
	if (username) {
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

socket.on('typing', function (data) {
	addChatTyping(data);
});

socket.on('stop-typing', function () {
	removeChatTyping();
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
			if (msgStack.length == msgStackSize) {
				msgStack.shift();
			}
			msgStackPosition = msgStack.push(message) - 1;
			socket.emit('stop-typing');
			typing = false;
		}
	} else if (event.which == 38) {
		var prevMsg = msgStack[msgStackPosition];
		if (prevMsg) {
			$inputField.val(prevMsg);
			if (msgStackPosition > 0) {
				msgStackPosition--;
			}
		}
	} else if (event.which == 40) {
		var nextMsg = msgStack[msgStackPosition];
		if (nextMsg) {
			$inputField.val(nextMsg);
			if (msgStackPosition + 1 < msgStack.length) {
				msgStackPosition++;
			}
		}
	}
});

$inputField.on('input', function () {
	updateTyping();
});

init();