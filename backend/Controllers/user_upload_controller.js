const imageupload = require("../config/imageupload.js");
const User = require("../Models/User.js");

const uploadUserAvatar = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    const url = await imageupload(req.file, false);
    await User.findByIdAndUpdate(req.user.id, { profilePic: url });
    res.json({ profilePic: url });
  } catch (e) {
    console.log(e);
    res.status(500).send("Internal Server Error");
  }
};

module.exports = { uploadUserAvatar };


