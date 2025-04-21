const express = require("express");
const { updateSettings } = require("../controllers/settingsController");
const { authMiddleware } = require("../middleware/authMiddleware");

const router = express.Router();

router.put("/", authMiddleware, updateSettings);

module.exports = router;
