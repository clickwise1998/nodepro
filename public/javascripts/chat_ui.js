//Contact with server for Interface changes
/*connect the server and the socket become that of the user*/
var socket = io.connect();
$(document).ready(function() {
var chatApp = new Chat(socket);

   socket.on('message', function (message) {
        /*alert('cli rec:'+message.text);*/
        var newElement = $('<div></div>').text(message.text);
        //append the message to the old messages
        $('#messages').append(newElement);
   });

   socket.on('checkResult', function (message) {
        $('#check-response').text(message.text);
        $('#check-response').hide();
        $('#check-response').dblclick();
   });

  $('textarea').addProofreader(socket);
   setInterval(function() {
       /*every second request for the current names*/
       socket.emit('rooms');
   }, 1000);
  });/*end ready*/

