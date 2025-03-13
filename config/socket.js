const { Server } = require('socket.io');


const initializeSocket = () => {
  const io = new Server({
    cors: {
      origin: ['http://localhost:5173', 'http://localhost:5500']
    }
  });

  return io;
}


module.exports = initializeSocket;