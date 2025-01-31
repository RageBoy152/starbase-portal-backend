const { Server } = require ("socket.io");

const io = new Server({
  cors: {
    origin: ['http://localhost:5173']
  }
});



io.on('connection', socket => {
  console.log("Client connected.");

  socket.on('test', async () => {
    io.sockets.emit('testRes', "sup");
  });
});



io.listen(3000);
console.log("Server listening on http://localhost:3000");