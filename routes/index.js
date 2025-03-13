const authRoutes = require('./authRoutes');
const logRoutes = require('./logRoutes');
const objectRoutes = require('./objectRoutes');


const setupRoutes = (app) => {
  app.use('/auth', authRoutes);
  app.use('/tracking-logs', logRoutes);
  app.use('/objects', objectRoutes);
}


module.exports = setupRoutes;
