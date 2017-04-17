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
        chatApp.sendMessage($('#room').text(), message);
        $('#messages').append(divEscapedContentElement(systemMessage));
        $('#messages').scrollTop($('#messages').prop('scrollHeight'));
    }
    $('#send-message').val('');
};

let socket = io.connect();

$(document).ready(() => {
  var chatApp = new Chat(socket);

  //output name changes result
  socket.on('nameResult', (result) => {
    var message;

    if(result.success) {
      message = 'You are now known as a ' + result.name + '.';
    } else {
      message = result.message;
    }

    $('#messages').append(divSystemContentElement(message));
  });

  //output changing rooms result
  socket.on('joinResult', (result) => {
    $('#room').text(result.room);

    $('#messages').append(divSystemContentElement('Room changed'));
  });

  //out put messages
  socket.on('message', (message) => {
    var newElement = $('<div></div>').text(message.text);

    $('#messages').append(newElement);
  });

  //output list of availale rooms
  socket.on('rooms', (rooms) => {
    $('#room-list').empty();
    for(var room in rooms) {
      room = room.substring(1, room.length);
      if(room != '') {
        $('#room-list').append(divEscapedContentElement(room));
      }
    }

    $('#room-list div').click(() => {
      chatApp.processCommand('/join ' + $(this).text());
      $('#send-message').focus();
    })
  });

  setInterval(() => {
    socket.emit('rooms');
  }, 1000);

  $('#send-message').focus();

  $('#send-form').on('submit', () => {
    processUserInput(chatApp, socket);
    return false;
  });
});
