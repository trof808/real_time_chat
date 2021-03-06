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
    let message = $('#send-message').val();
    let systemMessage;
    if(message.charAt(0) == '/') {
        systemMessage = chatApp.processCommand(message);
        if(systemMessage) {
            $('#messages').append(divSystemContentElement(systemMessage));
        }
    } else {
        let options = {
          text: message,
          flag: 'mes'
        }
        chatApp.sendMessage($('#room').text(), options);
        // $('#messages').append(divEscapedContentElement(message));
        $('#messages').scrollTop($('#messages').prop('scrollHeight'));
    }
    $('#send-message').val('');
};
