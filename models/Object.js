const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { v4: uuidv4 } = require('uuid');


const LogSchema = new Schema({
  id: { type: String, required: true, default: uuidv4 },
  uploadDate: { type: Date, required: true, default: Date.now },
  editedAt: { type: Date, required: true },
  userId: { type: String, required: true },
  userName: { type: String, required: true },
  userAvatar: { type: String, required: true },
  messageBody: { type: String, required: true },
  attachments: { type: Array, required: true }
}, { _id: false });


const ObjectSchema = new Schema({
  id: { type: String, unique: true, required: true, default: uuidv4 },
  objectSN: { type: String, required: false },
  hardwareType: { type: String, required: true },
  prefabPath: { type: String, required: true },
  hardwareOrigin: { type: String, required: true },
  hardwareOnMap: { type: String, required: true },
  objectName: { type: String, required: true },
  standId: { type: String, required: false },
  spotId: { type: String, required: false },
  zIndex: { type: String, required: true },
  options: { type: mongoose.Schema.Types.Mixed, required: true },
  logs: { type: [LogSchema], required: true, default: [] },
  position: {
    x: { type: Number, required: true },
    y: { type: Number, required: true }
   }
}, { timestamps: true });



const Object = mongoose.model('ObjectSchema', ObjectSchema);
module.exports = Object;