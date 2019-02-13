var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var chatRouter = require('./routes/chat');

var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

var {generateMessage, generateLocationMessage} = require('./utils/message');
var {isRealString} = require('./utils/validation');
var {Users} = require('./utils/users');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

var users = new Users();
// Listen to a new connection from client
io.on('connection', (socket) => {
  /* Custom events begin */
  socket.on('join', (params, callback) => {
    if(!isRealString(params.name) || !isRealString(params.room)) {
      return callback('Name and room name are required');
    }

    // socket io rooms
    socket.join(params.room);
    // adding user to user list after removing user from all chat rooms
    users.removeUser(socket.id);
    users.addUser(socket.id, params.name, params.room);

    // emitting updated list to entire chat room
    io.to(params.room).emit('updateUserList', users.getUserList(params.room));

    // When new user joins, he gets a greeting from the admin
    socket.emit('newMessage', generateMessage('Admin', 'Welcome to the chat app'));
    // new user login is broadcast to all other users in the chat room
    socket.broadcast.to(params.room).emit('newMessage', generateMessage('Admin', `${params.name} has joined`));

    callback();
  });

  // listening to client's create message event
  // broadcasts the message to the entire chat app
  socket.on('createMessage', (message, callback) => {
    var user = users.getUser(socket.id);
    // sends client's new message to entire chat app
    if(user && isRealString(message.text)) {
      io.to(user.room).emit('newMessage', generateMessage(user.name, message.text));
    }

    // If message is received, we acknowledge it
    callback('This is from the server');
  });

  // Broadcasts location message to entire chat app
  socket.on('createLocationMessage', (message) => {
    var user = users.getUser(socket.id);

    if(user) {
      var name = user.name;
      io.to(user.room).emit('newLocationMessage', generateLocationMessage(`${name}`, message.latitude, message.longitude));
    }
  });

  /* Custom events end */
  socket.on('disconnect', () => {
    var user = users.removeUser(socket.id);

    if(user) {
      io.to(user.room).emit('updateUserList', users.getUserList(user.room)); // sending updated user list
      io.to(user.room).emit('newMessage', generateMessage('Admin', `${user.name} has left`));
    }
  });
});

app.use(function(req, res, next) {
  res.io = io;
  next();
});

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/chat', chatRouter);
app.use('/jquery', express.static(__dirname + "/node_modules/jquery/dist/"));
app.use('/moment', express.static(__dirname + "/node_modules/moment/"));

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = {app: app, server: server};
