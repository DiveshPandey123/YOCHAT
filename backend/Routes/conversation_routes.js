const express = require("express");
const router = express.Router();

const {
  createConversation,
  getConversation,
  getConversationList,
  deleteConversation,
  updateConversation,
  addMembers,
  removeMember,
  leaveConversation,
  uploadGroupAvatar,
} = require("../Controllers/conversation_controller.js");
const fetchuser = require("../middleware/fetchUser.js");
const upload = require("../config/multerConfig.js");

router.post("/", fetchuser, createConversation);
router.get("/:id", fetchuser, getConversation);
router.get("/", fetchuser, getConversationList);
router.delete("/", fetchuser, deleteConversation);
router.put("/:id", fetchuser, updateConversation);
router.post("/:id/members", fetchuser, addMembers);
router.delete("/:id/members/:memberId", fetchuser, removeMember);
router.post("/:id/leave", fetchuser, leaveConversation);
router.post("/:id/avatar", fetchuser, upload.single("file"), uploadGroupAvatar);

module.exports = router;
