const Task = require("../models/Task");

exports.addTask = async (req, res) => {
  const { title, hours, minutes, status, subtasks } = req.body;
  try {
    const task = new Task({ userId: req.user.id, title, hours, minutes, status, subtasks });
    await task.save();
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ error: "Error adding task" });
  }
};

exports.updateTask = async (req, res) => {
  const { id } = req.params;
  try {
    const task = await Task.findByIdAndUpdate(id, req.body, { new: true });
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: "Error updating task" });
  }
};

exports.deleteTask = async (req, res) => {
  const { id } = req.params;
  try {
    await Task.findByIdAndDelete(id);
    res.json({ message: "Task deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Error deleting task" });
  }
};
