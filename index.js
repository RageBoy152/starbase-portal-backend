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



  async function fetchObjects(reqSocket, idSelector) {
    Object.find(idSelector ? { id: idSelector } : {})
    .then(dbRes => {
      reqSocket.emit('objectsFetchRes', dbRes);
    })
    .catch(err => {
      let errMsg = "DB error on 'objectsFetchReq'";

      console.log(`${errMsg}. ${err}`);
      reqSocket.emit('objectsFetchRes', { error_message: errMsg, error: err });
    });
  }



  socket.on('objectsFetchReq', function () { fetchObjects(this); });
  socket.on('objectFetchFromIdReq', function (id) { fetchObjects(this, id); });


  socket.on('addNewObject', async function (newObject) {
    const NewObject = new Object(newObject);

    NewObject.save()
    .then(dbRes => {
      fetchObjects(this);
    })
    .catch(err => {
      let errMsg = "DB error on 'addNewObject'";

      console.log(`${errMsg}. ${err}`);
      io.sockets.emit('objectsFetchRes', { error_message: errMsg, error: err });
    });
  });



  socket.on('deleteObject', async function (objectId) {
    Object.findOneAndDelete({ id: objectId })
    .then(dbRes => {
      fetchObjects(this);
    })
    .catch(err => {
      let errMsg = "DB error on 'deleteObject'";

      console.log(`${errMsg}. ${err}`);
      io.sockets.emit('objectsFetchRes', { error_message: errMsg, error: err });
    });
  });


  socket.on('updateObject', async function (object) {
    Object.findOneAndUpdate({ id: object.id }, object)
    .then(dbRes => {
      fetchObjects(this);
    })
    .catch(err => {
      let errMsg = "DB error on 'updateObject'";

      console.log(`${errMsg}. ${err}`);
      io.sockets.emit('objectsFetchRes', { error_message: errMsg, error: err });
    });
  });



});