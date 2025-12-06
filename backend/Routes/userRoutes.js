const express = require("express");
const router = express.Router();
const fetchuser = require("../middleware/fetchUser.js");
const {
  getPresignedUrl,
  getOnlineStatus,
} = require("../Controllers/userController.js");
const {
  getNonFriendsList,
  updateprofile,
} = require("../Controllers/auth_controller.js");
const upload = require("../config/multerConfig.js");
const { uploadUserAvatar } = require("../Controllers/user_upload_controller.js");

router.get("/online-status/:id", fetchuser, getOnlineStatus);
router.get("/non-friends", fetchuser, getNonFriendsList);
router.put("/update", fetchuser, updateprofile);
router.get("/presigned-url", fetchuser, getPresignedUrl);
router.post("/avatar", fetchuser, upload.single("file"), uploadUserAvatar);

module.exports = router;
