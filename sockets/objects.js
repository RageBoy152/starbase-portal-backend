const { checkUserAuthorization } = require('../auth');
const Object = require('../models/Object');



const objectsListeners = (io, socket) => {

  //    ADD OBJECT    \\
  
  socket.on('addNewObject', function (newObject) {
    if (!checkUserAuthorization(socket.id)) { return socket.emit('objectSocketRequestError', { action: 'addNewObject', error_message: 'Unauthorized action.', error: 403 }); }
    
  
    const NewObject = new Object(newObject);
  
    NewObject.save()
    .then(dbRes => {
      io.emit('updateThisObject', dbRes);     // send single new db object to everyone
    })
    .catch(err => {
      let errMsg = "DB error on 'addNewObject'";
  
      console.error(`${errMsg}. ${err}`);
      socket.emit('objectSocketRequestError', { action: 'addNewObject', error_message: errMsg, error: err });
    });
  });



  //    DELETE OBJECT    \\
  
  socket.on('deleteObject', async function (objectId) {
    if (!checkUserAuthorization(socket.id)) { return socket.emit('objectSocketRequestError', { action: 'deleteObject', error_message: 'Unauthorized action.', error: 403 }); }
  
  
    Object.findOneAndDelete({ id: objectId })
    .then(dbRes => {
      io.emit('deleteThisObject', objectId);
    })
    .catch(err => {
      let errMsg = "DB error on 'deleteObject'";
  
      console.error(`${errMsg}. ${err}`);
      socket.emit('objectSocketRequestError', { action: 'deleteObject', error_message: errMsg, error: err });
    });
  });



  //    UPDATE OBJECT    \\
    
  socket.on('updateObject', function (object, options) {
    if (!checkUserAuthorization(socket.id)) { return socket.emit('objectSocketRequestError', { action: 'updateObject', error_message: 'Unauthorized action.', error: 403 }); }


    const { save, moving } = options;


    if (save) {
      // save object to db and send to everyone

      Object.findOneAndUpdate({ id: object.id }, object, { new: true })
      .then(dbRes => {
        io.emit('updateThisObject', dbRes);
      })
      .catch(err => {
        let errMsg = "DB error on 'updateObject'";

        console.error(`${errMsg}. ${err}`);
        socket.emit('objectSocketRequestError', { action: 'updateObject', error_message: errMsg, error: err });
      });
    }
    else if (moving) {
      // send updated object to everyone but sender
      socket.broadcast.emit('updateThisObject', object);
    }
    else {
      // send updated object to everyone
      io.emit('updateThisObject', object);
    }
  });
}



module.exports = objectsListeners;