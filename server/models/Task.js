const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true },
  hours: { type: Number, default: 0 },
  minutes: { type: Number, default: 0 },
  status: { type: String, enum: ["Completed", "In Progress", "Hold"], default: "In Progress" },
  subtasks: [{ title: String, hours: Number, minutes: Number, status: String }],
});

module.exports = mongoose.model("Task", taskSchema);
