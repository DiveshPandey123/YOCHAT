// secrets.js
const dotenv = require("dotenv");
const path = require("path");

// Load .env from the backend folder explicitly so running server from
dotenv.config({ path: path.resolve(__dirname, "./.env") });

const MONGO_URI = process.env.MONGO_URI;
const GENERATIVE_API_KEY = process.env.GENERATIVE_API_KEY;
const EMAIL = process.env.EMAIL;
const PASSWORD = process.env.PASSWORD;

// ADDED Cloudinary
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME; // ADDED
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;       // ADDED
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET; // ADDED
const CLOUDINARY_UPLOAD_PRESET = process.env.CLOUDINARY_UPLOAD_PRESET || "chat-app"; // optional



module.exports = {
  MONGO_URI,
  GENERATIVE_API_KEY,
  EMAIL,
  PASSWORD,
  CLOUDINARY_CLOUD_NAME,   // ADDED
  CLOUDINARY_API_KEY,      // ADDED
  CLOUDINARY_API_SECRET,   // ADDED
  CLOUDINARY_UPLOAD_PRESET // ADDED
};
