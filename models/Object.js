const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { v4: uuidv4 } = require('uuid');



const ObjectSchema = new Schema({
  id: { type: String, unique: true, required: true, default: uuidv4 },
  objectSN: { type: Number, required: false },
  hardwareType: { type: String, required: true },
  hardwareOrigin: { type: String, required: true },
  standId: { type: String, required: false },
  spotId: { type: String, required: false },
  options: { type: mongoose.Schema.Types.Mixed, required: true },
  position: { type: new mongoose.Schema({
    x: { type: Number, required: true },
    y: { type: Number, required: true }
  }), required: true }
}, {timestamps: true});



const Object = mongoose.model('ObjectSchema', ObjectSchema);
module.exports = Object;