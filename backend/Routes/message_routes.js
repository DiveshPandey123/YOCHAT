// routes/message_routes.js

const express = require("express");
const router = express.Router();

const fetchuser = require("../middleware/fetchUser.js");

// CHANGED: Central multer config (memoryStorage) import karein
const upload = require("../config/multerConfig.js"); // CHANGED

const {
  sendMessage,
  allMessage,
  deletemesage,
  // getPresignedUrl, // REMOVED AWS
} = require("../Controllers/message_controller.js");

// REMOVED AWS: presigned URL endpoint
// router.get("/presigned-url", fetchuser, getPresignedUrl); // REMOVED AWS

// Messages
router.get("/:id/:userid", fetchuser, allMessage);

// CHANGED: Multer middleware added for file upload handling
router.post("/send", fetchuser, upload.single("file"), sendMessage); // CHANGED

router.post("/delete", fetchuser, deletemesage);

module.exports = router;
