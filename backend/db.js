const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

// Load .env from the backend folder explicitly so running server from
// a different cwd (for example when using concurrently from frontend)
// still picks up the correct variables.
dotenv.config({ path: path.resolve(__dirname, "./.env") });

const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      console.error("Error: MONGO_URI is not defined. Make sure backend/.env exists and contains MONGO_URI.");
      process.exit(1);
    }

    const conn = await mongoose.connect(process.env.MONGO_URI, {
      dbName: "conversa-chatapp",
    });

    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
