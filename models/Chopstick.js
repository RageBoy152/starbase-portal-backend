const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { v4: uuidv4 } = require('uuid');



const ChopstickSchema = new Schema({
  id: { type: String, unique: true, required: true, default: uuidv4 },
  carriageHeight: { type: Number, required: true },
  leftArm: { type: Number, required: true },
  rightArm: { type: Number, required: true },
  carriageSpeed: { type: Number, required: true },
  armSpeed: { type: Number, required: true }
}, { timestamps: true });



const Chopstick = mongoose.model('ChopstickSchema', ChopstickSchema);
module.exports = Chopstick;