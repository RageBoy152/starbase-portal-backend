const mongoose = require('mongoose');
require("dotenv").config();


const dbURI = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PWD}@starbaseportaldb.nzcri.mongodb.net/?retryWrites=true&w=majority&appName=StarbasePortalDB`;


const connectDB = async () => {
  try {
    console.log("Connecting to database...");

    await mongoose.connect(dbURI);
    
    console.log("Connected to database.");
  }
  catch (err) {
    console.error("Error connecting to MongoDB");
    console.error(err);
  }
}


module.exports = connectDB;