// server.js
const express = require("express");
const connectDB = require("./db.js");
const cors = require("cors");
const http = require("http");
const { initSocket } = require("./socket/index.js");

const app = express();
const PORT = process.env.PORT || 5000;

// CHANGED: strict CORS with credentials and exact origin
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000"; 
app.use(
  cors({
    origin: FRONTEND_URL, // no wildcard
    credentials: true,    
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"], 
    allowedHeaders: ["Content-Type", "auth-token"], 
  })
);

// Body parsers (keep)
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(express.json({ limit: "50mb" }));

// Routes (keep your actual files)
app.get("/", (req, res) => res.send("Hello World"));
app.use("/auth", require("./Routes/auth_routes.js"));
app.use("/user", require("./Routes/userRoutes.js"));
app.use("/message", require("./Routes/message_routes.js"));
app.use("/conversation", require("./Routes/conversation_routes.js"));

const server = http.createServer(app);

// Socket.io init
initSocket(server);

// Start + DB connect
server.listen(PORT, () => {
  console.log(`🚀 Server started at http://localhost:${PORT}`);
  connectDB();
});
