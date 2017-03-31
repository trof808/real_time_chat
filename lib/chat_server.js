'use strict';
const socketio = require('socket.io');

let io;
let guestNumber = 1;
let nickNames = {};
let namesUsed = [];
let currentRoom = {};

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

        socket.on('rooms', () => {
            socket.emit('rooms', io.sockets.manager.rooms);
        });

        //handle user disconnection
        handleClientDisconnection(socket, nickNames, namesUsed);
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
        text: nickNames[socket.id] + ' has joined ' + room + '.'
    });

    //users in current room
    let usersInRoom = io.sockets.clients(room);

    if (usersInRoom.length > 1) {
        //info about members in current room
        let usersInRoomSummary = 'Users currently in ' + room + ':';
        //handle usersInRoom array and add them to the summary
        usersInRoom.forEach((user, index) => {
            let userSocketId = user.id;
            if (userSocketId !== socket.id) {
                if (index > 0) {
                    usersInRoomSummary += ', ';
                }
                usersInRoomSummary += user;
            }
        });
        // for (const index in usersInRoom) {
        //     let userSocketId = usersInRoom[index].id;
        //     if (userSocketId !== socket.id) {
        //         if (index > 0) {
        //             usersInRoomSummary += ', ';
        //         }
        //         usersInRoomSummary += usersInRoom[index];
        //     }
        // }
        usersInRoomSummary += '.';
        //tell new user about members in current room
        socket.emit('message', {text: usersInRoomSummary});
    }
};

//sending message from user to users in current room
const handleMessageBroadcasting = (socket, nickNames) => {
    socket.on('message', (message) => {
        socket.broadcast.to(message.room).emit('message', {
            text: nickNames[socket.id] + ': ' +  message.text
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
                message: 'name cannot begin with Guest'
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
                    message: name + ' is already used!'
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
