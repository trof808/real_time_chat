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

    if (usersInRoom.length <= 1) {
    } else {
        //info about members in current room
        let usersInRoomSummary = 'Users currently in ' + room + ':';
        //handle usersInRoom array and add them to the summary
        for (const index in usersInRoom) {
            let userSocketId = usersInRoom[index].id;
            if (userSocketId !== socket.id) {
                if (index > 0) {
                    usersInRoomSummary += ', ';
                }
                usersInRoomSummary += usersInRoom[index];
            }
        }
        usersInRoomSummary += '.';
        //tell new user about members in current room
        socket.emit('message', {text: usersInRoomSummary});
    }
};

const handleMessageBroadcasting = (socket, nickNames) => {

};

const handleNameChangeAttempts = (socket, nickNames, namesUsed) => {

};

const handleRoomJoining = (socket) => {

};
