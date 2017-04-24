//new class Chat with socket parameter
const Chat = function(socket) {
  this.socket = socket;
};

//send chat message method
Chat.prototype.sendMessage = function(room, text) {
    let message = {
        room: room,
        text: text
    };

    this.socket.emit('message', message);
};

//changing room method
Chat.prototype.changeRoom = function(room) {
    socket.emit('join', {
        newRoom: room
    });
};

//handling user commands
Chat.prototype.processCommand = function(command) {
    //get message to array
    let words = command.split(" ");
    //get command word from array
    let commands = words[0].substring(1, words[0].length).toLowerCase();

    var message  = false;

    switch (commands) {
        //if command is join call method changeRoom
        case 'join':
            words.shift();
            let room = words.join(" ");
            this.changeRoom(room);
            break;
        case 'nick':
            //if command is nick emit current socket with nameAttempt event
            words.shift();
            let nickname = words.join(" ");
            this.socket.emit('nameAttempt', nickname);
            break;
        default:
            //if command is incorrect return error message
            message = 'Unrecognized command message';
            break;
    }
    return message;
};
