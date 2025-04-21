const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  taskSettings: { type: Object, default: {} },
  previewSettings: { type: Object, default: {} },
  exportSettings: { type: Object, default: {} },
});

module.exports = mongoose.model("Settings", settingsSchema);
