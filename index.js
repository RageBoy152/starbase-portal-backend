require('dotenv').config();

const connectDB = require('./config/db');
const initializeSocket = require('./config/socket');
const initializeExpress = require('./config/express');
const { initializePassport } = require('./auth');
const setupRoutes = require('./routes');
const setupSocketListeners = require('./sockets');



const startServer = async () => {
  try {
    // db
    await connectDB();


    // socket
    const io = initializeSocket();
    io.listen(process.env.SOCKET_PORT);
    console.log(`Socket.IO listening on http://localhost:${process.env.SOCKET_PORT}`);

    io.on('connect', (socket) => { setupSocketListeners(io, socket); });


    // setup passport
    initializePassport();


    // express
    const app = initializeExpress();
    app.listen(process.env.EXPRESS_PORT, () => console.log(`Express.JS listening on http://localhost:${process.env.EXPRESS_PORT}`));

    setupRoutes(app);
  }
  catch (err) {
    console.error("Error starting server.");
    console.error(err);
  }
}



startServer();