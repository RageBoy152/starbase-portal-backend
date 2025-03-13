const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');


const initializeExpress = () => {
  const app = express();

  // configure cors
  app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true,
    exposedHeaders: ['Set-Cookie']
  }));

  // configure parsing behaviours
  app.use(cookieParser());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }))


  // return app
  return app;
}


module.exports = initializeExpress;