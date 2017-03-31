//output unreliable content
const divEscapedContentElement = (message) => {
    return $('<li></li>').text(message);
};
//output reliable content
const divSystemContentElement = (message) => {
    return $('<li></li>').html('<i>' + message + '</i>')
};
//handle user input data
const processUserInput = (chatApp, socket) => {
    let message = $('#m').val();
    let systemMessage;
    if(message.charAt(0) == '/') {
        systemMessage = chatApp.processCommand(message);
        if(systemMessage) {
            $('#messages').append(divSystemContentElement(systemMessage));
        }
    } else {
        chatApp.sendMessage($('#room').text(), message);
        $('#messages').append(divEscapedContentElement(systemMessage));
        $('#messages').scrollTop($('#messages').prop('scrollHeight'));
    }
    $('#m').val('');
};

let socket = io.connect();
