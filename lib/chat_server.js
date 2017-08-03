var socketio = require('socket.io');
var io;
var guestNumber = 1;
var nickNames = {};
var namesUsed = [];
var currentRoom = {};
exports.listen = function(server) {
  io = socketio.listen(server);
  io.set('log level', 1);
io.sockets.on('connection', function (socket) {
    handleMessageBroadcasting(socket, nickNames);
  });
};
function getCheck(originText,socket){

      var http=require('http');
      var body = {"data":originText};
      var bodyString = JSON.stringify(body);
      var headers = {
          'Content-Type': 'application/json',
          'Content-Length': bodyString.length
      };

      var options = {
          host: '47.92.79.221',
          port: 8080,
          path: '/checkDocument',
          method: 'POST',
          headers: headers
      };

      var req=http.request(options,function(res){
          res.setEncoding('utf-8');
          var responseString = '';
          res.on('data', function(data) {
             responseString += data;
          });

          res.on('end', function() {
             //这里接收的参数是字符串形式,需要格式化成json格式使用
             console.log('-----resBody-----',responseString);
                 socket.emit('checkResult',{
                    /*text: 'response:'+nickNames[socket.id] + ': ' + responseString*/
                    text: responseString
                 });
          });
          req.on('error', function(e) {
            // TODO: handle error.
            console.log('-----error-------',e);
          });
      });
      req.write(bodyString);
      req.end();
      console.log('outer responseString :',http.res);
}

function getCheckSent(originText,socket){

      var strs= new Array();
      strs=originText.split(".");
      var i=0;
      checkOne(strs,0,socket);
}

function checkOne(strs,i,socket){

      var http=require('http');
      var body = {"data":strs[i]};
      var bodyString = JSON.stringify(body);
      var headers = {
          'Content-Type': 'application/json',
          'Content-Length': bodyString.length
      };


      var options = {
          host: '47.92.79.221',
          port: 8080,
          path: '/checkDocument',
          method: 'POST',
          headers: headers
      };


      var req=http.request(options,function(res){
          res.setEncoding('utf-8');
          var responseString = '';
          res.on('data', function(data) {
             responseString += data;
          });

          res.on('end', function() {
             //这里接收的参数是字符串形式,需要格式化成json格式使用
             console.log('-----resBody-----',responseString);
                 socket.emit('checkResult',{
                    /*text: 'response:'+nickNames[socket.id] + ': ' + responseString*/
                    text: responseString
                 });
                 if(i<strs.length-1)
                 {
                   checkOne(strs,i+1,socket);
                 }
          });
          req.on('error', function(e) {
            // TODO: handle error.
            console.log('-----error-------',e);
          });
      });
      req.write(bodyString);
      req.end();
      console.log('outer responseString :',http.res);
  
}

function handleMessageBroadcasting(socket) {
  socket.on('message', function (message) {
    console.log("rec:"+message.text);
    socket.broadcast.to(message.room).emit('message', {
      text: nickNames[socket.id] + ': ' + message.text
    });
    getCheckSent(message.text,socket);
  });
}
