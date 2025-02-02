const { Server } = require ("socket.io");
const mongoose = require('mongoose');
const dotenv = require("dotenv").config();


const Object = require('./models/Object');



//    MONGOOSE CONNECTION    \\

const dbURI = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PWD}@starbaseportaldb.nzcri.mongodb.net/?retryWrites=true&w=majority&appName=StarbasePortalDB`;

mongoose.connect(dbURI)
  .then((res) => {
    console.log("Connected to database.");
    
    //  start socket.io server
    try {
      io.listen(3000);
      console.log("Server listening on http://localhost:3000");
    } catch (err) {
      console.error(`Error starting Socket.IO server: ${err}`);
    }
  })
  .catch((err) => {
    console.log(`Error connecting to database. ${err}`);
  });



//    CONFIG SOCKET.IO SERVER    \\

const io = new Server({
  cors: {
    origin: ['http://localhost:5173']
  }
});




io.on('connection', socket => {
  console.log("Client connected.");



  async function fetchObjects() {
    Object.find()
    .then(dbRes => {
      io.sockets.emit('objectsFetchRes', dbRes);
    })
    .catch(err => {
      let errMsg = "DB error on 'objectsFetchReq'";

      console.log(`${errMsg}. ${err}`);
      io.sockets.emit('objectsFetchRes', { error_message: errMsg, error: err });
    });
  }



  socket.on('objectsFetchReq', fetchObjects);


  socket.on('addNewObject', async (newObject) => {
    const NewObject = new Object(newObject);

    NewObject.save()
    .then(dbRes => {
      fetchObjects();
    })
    .catch(err => {
      let errMsg = "DB error on 'addNewObject'";

      console.log(`${errMsg}. ${err}`);
      io.sockets.emit('objectsFetchRes', { error_message: errMsg, error: err });
    });
  });


  socket.on('deleteObject', async (objectId) => {
    Object.findOneAndDelete({ id: objectId })
    .then(dbRes => {
      fetchObjects();
    })
    .catch(err => {
      let errMsg = "DB error on 'deleteObject'";

      console.log(`${errMsg}. ${err}`);
      io.sockets.emit('objectsFetchRes', { error_message: errMsg, error: err });
    });
  });


  socket.on('updateObject', async (object) => {
    Object.findOneAndUpdate({ id: object.id }, object)
    .then(dbRes => {
      fetchObjects();
    })
    .catch(err => {
      let errMsg = "DB error on 'updateObject'";

      console.log(`${errMsg}. ${err}`);
      io.sockets.emit('objectsFetchRes', { error_message: errMsg, error: err });
    });
  });



});