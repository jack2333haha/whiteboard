
const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const port = process.env.PORT || 3001;

app.use(express.static(__dirname + '/public'));

function onConnection(socket,roomId){
  // console.log(data);
  socket.on('drawing', (data) => {
    socket.to(roomId).emit('drawing', data);   //为什么broadcast可以用，to（roomId）不能用？？？奥，是我还么join（roomId），哎，，专心啊
    console.log(data)
  });
}

// io.on('connection', onConnection);

http.listen(port, () => console.log('listening on port ' + port));




var numUsers = 0;  //这个不能存储到服务端，要存到小程序去

io.on('connection', (socket) => {
  console.log("建立连接成功");


  // 获取房间号码
  var roomId = socket.handshake.query.token;
  console.log("roomId:"+roomId);
  // console.log(socket);  里面太复杂，太多参数变量，不知道怎么用，有空再去研究吧


  //Drawing
  onConnection(socket,roomId);




  //Chatroom
  var addedUser = false;

  // when the client emits 'new message', this listens and executes
  socket.on('new message', (data) => {
    // we tell the client to execute 'new message'
    socket.to(roomId).emit('new message', {
      username: socket.username,
      message: data
    });
  });

  // when the client emits 'add user', this listens and executes
  socket.on('add user', (userInfo) => {
    if (addedUser) return;
    socket.join(roomId);      //加入房间
    // we store the username in the socket session for this client
    socket.username = userInfo.nickName;
    // ++numUsers;
    addedUser = true;
    socket.emit('login');
    // console.log("userInfo；"+userInfo);
    // echo globally (all clients) that a person has connected
    socket.to(roomId).emit('user joined', {
      userInfo: userInfo
    });
  });


  //监听房间内的准备消息
  socket.on('ready',(userInfo)=>{

    //告诉房间内其它成员，该用户已经准备好,并将该玩家的位置信息通知
    // console.log("userInfo.avatarUrl:"+userInfo.avatarUrl);
    io.to(roomId).emit('user ready',{
      userInfo:userInfo
    })
  });

  //监听房间内数据更新
  socket.on('update user',(data)=>{


    socket.to(roomId).emit('new users',data)
  });


  socket.on('start game',()=>{
    //这个时候就要开始游戏了，拿到词汇，返回给小程序，
    var word='苹果';
    console.log('start game');
    io.to(roomId).emit('hand out word',{      //发送给房间里的所有人
      word: word
    })
  });

  socket.on('stats result',(data)=>{

    socket.to(roomId).emit('new stats',data)

  });




  // when the client emits 'typing', we broadcast it to others
  socket.on('typing', () => {
    socket.to(roomId).emit('typing', {
      username: socket.username
    });
  });

  // when the client emits 'stop typing', we broadcast it to others
  socket.on('stop typing', () => {
    socket.to(roomId).emit('stop typing', {
      username: socket.username
    });
  });

  // when the user disconnects.. perform this
  socket.on('disconnect', () => {
    if (addedUser) {
      // --numUsers;

      // echo globally that this client has left
      socket.to(roomId).emit('user left', {
        username: socket.username
        // numUsers: numUsers
      });
    }
  });
});
