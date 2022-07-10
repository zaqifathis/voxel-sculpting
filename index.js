const express = require('express');
const app = express();
const http = require('http');
const cors = require('cors');
const server = http.createServer(app);
const io = require('socket.io')(server);

app.use(express.static('public')); //go to public and load the html
// parse json request body
app.use(express.json());
// parse urlencoded request body
app.use(express.urlencoded({ extended: false }));
app.use(cors());

let playState = {
  host: null,
  opponent: null,
  state: {},
  randomGenerate: false,
};

io.on('connection', (socket) => {
  console.log('new connection:' + socket.id);
  //getting the data from the on-cut event

  //Assign host and the opponent
  if (!playState.host) {
    playState.host = socket.id;
  }

  socket.emit('user-connected', playState);

  socket.on('on-generate', (payload) => {
    if (socket.id === playState.host) {
      playState = payload;
    }

    socket.broadcast.emit('generated', playState);
  });

  socket.on('on-remove', (payload) => {
    //we need to receive the data from that event here
    //send the information/ata to the other player
    // socket.emit('sliced', payload)
    playState = payload;
    socket.broadcast.emit('removed', payload);
  });

  socket.on('disconnect', () => {
    // if (socket.id === playState.host) {
    //   playState = {
    //     host: null,
    //     opponent: null,
    //     state: {},
    //     current: null,
    //     firstTimeRightClick: false,
    //   };
    // }
  });
});

//listening the html and show on the page
server.listen(8080, () => {
  console.log('listening on *:8080');
});
