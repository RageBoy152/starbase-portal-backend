const objectsListeners = require('./objects');
const chopsticksListeners = require('./chopsticks');
const utilityListeners = require('./utility');


const setupSocketListeners = (io, socket) => {
  objectsListeners(io, socket);
  chopsticksListeners(io, socket);
  utilityListeners(io, socket);
}


module.exports = setupSocketListeners;
