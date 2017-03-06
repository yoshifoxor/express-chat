var socket = io.connect();

socket.on('connect', function() {
	emit('login');
});

socket.on('recieve', function(data)
{
	var item = $('<li>').append($('<small>').append(data.time));

	// data.typeを解釈し、要素を生成する
	if (data.type === 'login') {
		item.append($('<div>').append(data.user + 'がログインしました'));
	} else if (data.type === 'logout') {
		item.append($('<div>').append(data.user + 'がログアウトしました'));
	} else if (data.type === 'chat') {
		var msg = data.value.replace(/[!@$%<>'"&|]/g, '');
		item.append($('<div>').text(msg)).children('small').prepend(data.user + '：');
	} else {
		item.append($('<div>').append('不正なメッセージを受信しました'));
	}

	$('#messages').prepend(item).hide().fadeIn(800);
	//msgs.insertAdjacentHTML("beforeend", "<li>" + limsg + "</li>");

});

socket.on('disconnect', function() {});


function emit(type, msg) {
	socket.emit('notice', {
		type : type,
		user : $('#username').val(),
		value : msg,
	});
}

// クライアントからメッセージ送信
function sendMessage() {
	// メッセージ取得
	var msg = $('#input').val();
	$('#input').val("");
	// メッセージ通知
	emit('chat', msg);
}

$(document).ready(function() {
	$(window).on('beforeunload', function(e) {
		// ログアウト通知
		emit('logout');
	});

	$('#submit').click(sendMessage);
});