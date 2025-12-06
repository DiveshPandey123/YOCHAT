// config/multerConfig.js
const multer = require("multer");

// memoryStorage use karna hoga kyunki hum Cloudinary me .buffer bhej rahe hain
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  // CHANGED: optional file size limit and mime-checks add kar sakte hain
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

module.exports = upload; // CHANGED: export plain upload
