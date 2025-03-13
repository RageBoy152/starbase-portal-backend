const { checkUserAuthorization } = require('../auth');
const Chopstick = require('../models/Chopstick');



const chopsticksListeners = (io, socket) => {
  //    FETCH CHOPSTICK DATA FUNC    \\
  
  async function fetchChopstick(chopstickId, sendToAll = false) {
    let resultSocket = sendToAll ? io : socket;
  
  
    Chopstick.find({ id: chopstickId })
    .then(dbRes => {
      resultSocket.emit('chopstickFetchRes', dbRes);
    })
    .catch(err => {
      let errMsg = "DB error on 'chopsticksFetchRes'";
  
      console.log(`${errMsg}. ${err}`);
      socket.emit('chopstickFetchRes', { error_message: errMsg, error: err });
    });
  }
  
  
  
  //    GET CHOPSTICK DATA    \\
  
  socket.on('chopstickFetchReq', async function (chopstickId) {
  
    fetchChopstick(chopstickId);
  });
  
  
  
  //    SET CHOPSTICK DATA    \\
  
  socket.on('updateChopstickData', async function (chopstickData, saveToDB) {
  
    if (!saveToDB) {
      // tell other clients that this is the thing cool
  
      io.emit('chopstickFetchRes', [chopstickData]);
    }
    else {
      // save object to db
  
      Chopstick.findOneAndUpdate({ id: chopstickData.id }, chopstickData)
      .then(dbRes => {
        fetchChopstick(chopstickData.id, true);
      })
      .catch(err => {
        let errMsg = "Error updating chopstick data.";
  
        console.log(`${errMsg}. ${err}`);
        socket.emit('chopstickFetchRes', { error_message: errMsg, error: err });
      });
    }
  });
}



module.exports = chopsticksListeners;