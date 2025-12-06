// config/imageupload.js
// SINGLE SOURCE: Sab uploads Cloudinary pe yahin se jayenge; S3 support removed.

const cloudinary = require("cloudinary").v2;
const dotenv = require("dotenv");
dotenv.config({ path: "../../.env" });

// CHANGED: Correct env var names for Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, // CHANGED (fixed spelling)
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Optional: preset from env with fallback
const PRESET = process.env.CLOUDINARY_UPLOAD_PRESET || "chat-app"; // CHANGED

const imageupload = async (file, usepreset) => {
  try {
    if (!file || !file.buffer) {
      console.error("No file buffer received");
      return "";
    }

    usepreset = usepreset === undefined ? true : usepreset;

    // CHANGED: decide options based on preset flag
    let options = {};
    if (usepreset) {
      options = { upload_preset: PRESET };
    } else {
      options = { resource_type: "auto" };
    }

    // Stream upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(options, (error, result) => {
          if (error) {
            console.error(error); // will surface in server logs
            reject(error);
          } else {
            resolve(result);
          }
        })
        .end(file.buffer);
    });

    return result.secure_url || "";
  } catch (error) {
    console.error(error);
    return "";
  }
};

module.exports = imageupload;
// CHANGED: Exported function to handle image uploads to Cloudinary