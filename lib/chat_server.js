'use strict';
const socketio = require('socket.io');

let io;
let guestNumber = 1;
let nickNames = {};
let namesUsed = [];
let currentRoom = {};
let roomOptions = {};

//handle connections
exports.listen = (server) => {
    io = socketio.listen(server); // set up socket.io server with http server
    io.set('log level', 1);

    //handle every user connection
    io.sockets.on('connection', (socket) => {
        //give guest name to user
        guestNumber = assignGuestName(socket, guestNumber, nickNames, namesUsed);
        //move connected user to lobby
        joinRoom(socket, 'Lobby');
        //handle message sending, changing names, creating and changing rooms
        handleMessageBroadcasting(socket, nickNames);
        handleNameChangeAttempts(socket, nickNames, namesUsed);
        handleRoomJoining(socket);

        //handle rooms and send option to client
        handleRoomOptions(socket);

        //handle user disconnection
        handleClientDisconnection(socket, nickNames, namesUsed);
    });
};

const handleRoomOptions = (socket) => {
  socket.on('rooms', () => {

      for(let room in socket.rooms) {

        io.of('/').in(room).clients((err, clients) => {
          if(err) console.log(err);
          roomOptions[room] = clients.length;
        });

      }
      socket.emit('rooms', roomOptions);
  });
};

//give guest name to new user
const assignGuestName = (socket, guestNumber, nickNames, namesUsed) => {
    //creating guest name
    let name = 'Guest' + guestNumber;
    //connect new name with current socket id and add to nickNames
    nickNames[socket.id] = name;
    //tell client his new name
    socket.emit('nameResult', {
        success: true,
        name: name
    });
    //push new name to namesUsed
    namesUsed.push(name);
    return guestNumber + 1;
};

const joinRoom = (socket, room) => {
    //user joining room
    socket.join(room);

    //defining joining user to room
    currentRoom[socket.id] = room;
    //tell user about joining room
    socket.emit('joinResult', {room: room});
    //tell others users about joining new user
    socket.broadcast.to(room).emit('message', {
        text: nickNames[socket.id] + ' вошел в комнату ' + room + '.'
    });

    let clientsInRoom = [];

    io.of('/').in(room).clients((err, clients) => {
      if(err) console.log(err);
      clients.forEach((client) => {
        if(client == socket.id) {
          clientsInRoom.push('Вы');
        } else {
          clientsInRoom.push(nickNames[client]);
        }

      });

      socket.emit('message', {
        text: 'Пользователи в этой комнате: ' + clientsInRoom.join(', ')
      });
    });
};

//sending message from user to users in current room
const handleMessageBroadcasting = (socket, nickNames) => {
    socket.on('message', (message) => {
        socket.broadcast.to(message.room).emit('message', {
            text: nickNames[socket.id] + ': ' +  message.text,
            flag: message.flag
        });
        socket.emit('message', {
            text: 'Вы: ' +  message.text,
            flag: message.flag
        });
    });
};

//changing user name
const handleNameChangeAttempts = (socket, nickNames, namesUsed) => {
    socket.on('nameAttempt', (name) => {
        //if name begin with Guest handle error message
        if(name.indexOf('Guest') === 0) {
            socket.emit('nameResult', {
                success: false,
                message: 'имя не может начинаться с Guest'
            });
        } else {
            if (namesUsed.indexOf(name) === -1) {
                //save previous name
                let previousName = nickNames[socket.id];
                //save previous nameIndex
                let previousNameIndex = namesUsed.indexOf(previousName);
                //add new name as used
                namesUsed.push(name);
                //connect new name with current socket id
                nickNames[socket.id] = name;
                //delete previous name from used names
                delete namesUsed[previousNameIndex];
                //success message
                socket.emit('nameResult', {
                    success: true,
                    name: name
                });
                //tell users in current room about changing name
                socket.broadcast.to(currentRoom[socket.id]).emit('message', {
                    text: previousName + ' is changed name to: ' + name + '.'
                });
            } else {
                //if name is already used handle error message
                socket.emit('nameResult', {
                    success: false,
                    message: name + ' уже используется!'
                });
            }
        }
    });
};

//leave current room and join or creating new room
const handleRoomJoining = (socket) => {
    socket.on('join', (room) => {
        socket.leave(currentRoom[socket.id]);
        joinRoom(socket, room.newRoom);
    })
};

//handle user disconnection
const handleClientDisconnection = (socket, nickNames, namesUsed) => {
    socket.on('disconnet', () => {
        let nameIndex = namesUsed.indexOf(nickNames[socket.id]);
        delete namesUsed[nameIndex];
        delete nickNames[socket.id];
    });
};
