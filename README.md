# YOCHAT – Real-Time Chat Application (MERN + Socket.io)

YOCHAT is a real-time chat platform built using **Node.js**, **Express**, **MongoDB**, **React**, and **Socket.io**.  
It supports **1-to-1 chats**, **group chats**, **online status**, **message notifications**, **media uploads**, and a clean modern UI.

---

## 🚀 Features

### 👤 **User Authentication**
- JWT-based secure login/signup
- Password hashing
- Profile picture support
- User state stored globally using React Context

### 💬 **Real-Time Chatting**
- Live 1-to-1 chat
- Group chats
- Typing indicators
- Online/offline user presence
- Socket broadcasting message delivery

### 📁 **Media & File Uploads**
- Image/file upload using Multer
- User profile upload controller

### 🔔 **Notifications**
- Real-time "new message" sound & UI notifications
- Badge count on chat list

### 🌐 **Modern Frontend**
- Fully responsive React UI
- Clean components & modular structure
- ChatArea, Message List, Modals, Navbar, Dashboard

### 📡 **Socket.io Integration**
- Real-time message updates
- Typing animation
- Group message broadcast
- Online users tracking

---

## 📂 Project Structure

YOCHAT/
│
├── backend/
│ ├── config/
│ │ ├── imageupload.js
│ │ └── multerConfig.js
│ │
│ ├── Controllers/
│ │ ├── auth_controller.js
│ │ ├── conversation_controller.js
│ │ ├── message_controller.js
│ │ ├── user_upload_controller.js
│ │ └── userController.js
│ │
│ ├── middleware/
│ │ └── fetchUser.js
│ │
│ ├── Models/
│ │ ├── Conversation.js
│ │ ├── Message.js
│ │ └── User.js
│ │
│ ├── Routes/
│ │ ├── auth_routes.js
│ │ ├── conversation_routes.js
│ │ ├── message_routes.js
│ │ └── userRoutes.js
│ │
│ ├── socket/
│ │ ├── handlers.js
│ │ └── index.js
│ │
│ ├── uploads/
│ ├── .env
│ ├── db.js
│ ├── server.js
│ ├── secrets.js
│ ├── package.json
│ └── README.md
│
└── frontend/
├── public/
│ ├── index.html
│ ├── manifest.json
│ ├── robots.txt
│ ├── logo files
│ └── favicon icons
│
├── src/
│ ├── assets/
│ │ └── newmessage.wav
│ │
│ ├── components/
│ │ ├── Authentication/
│ │ │ ├── Auth.js
│ │ │ ├── Login.js
│ │ │ └── Signup.js
│ │ │
│ │ ├── Dashboard/
│ │ │ ├── ChatArea.js
│ │ │ ├── ChatAreaTop.js
│ │ │ ├── Chats.js
│ │ │ ├── Dashboard.js
│ │ │ ├── MyChattis.js
│ │ │ ├── NewChats.js
│ │ │ └── SingleMessage.js
│ │ │
│ │ ├── miscellaneous/
│ │ │ ├── ChatloadingSpinner.js
│ │ │ ├── DeleteMessageModal.js
│ │ │ ├── FileUploadModal.js
│ │ │ ├── GroupDetailsModal.js
│ │ │ ├── NewMessage.js
│ │ │ └── ProfileModal.js
│ │ │
│ │ ├── Navbar/
│ │ │ ├── Navbar.js
│ │ │ └── ProfileMenu.js
│ │ │
│ │ └── Home.js
│ │
│ ├── context/
│ │ ├── appState.js
│ │ └── chatContext.js
│ │
│ ├── App.js
│ ├── App.css
│ ├── index.js
│ ├── index.css
│ ├── typingAnimation.json
│ ├── reportWebVitals.js
│ └── setupTests.js
│
└── package.json


---

## 🛠️ Tech Stack

### **Frontend**
- React.js  
- Context API  
- JavaScript  
- CSS  
- Web Animations  
- Lottie (Typing animation)

### **Backend**
- Node.js  
- Express.js  
- MongoDB + Mongoose  
- Multer (file uploads)  
- JWT Authentication  
- Bcrypt (password hashing)

### **Realtime Engine**
- Socket.io  
- Event-based messaging system

---

## ⚙️ Installation & Setup

### 🔹 1. Clone the repo

git clone https://github.com/your-username/YOCHAT.git
cd YOCHAT
🖥️ Backend Setup
🔹 2. Go to backend

cd backend
🔹 3. Install backend dependencies

npm install
🔹 4. Create .env

PORT=5000
MONGO_URL=your_mongodb_url
JWT_SECRET=your_secret_key
🔹 5. Start backend

npm start
🌐 Frontend Setup
🔹 1. Go to frontend

cd ../frontend
🔹 2. Install frontend dependencies

npm install
🔹 3. Start React app

npm start
📡 Real-Time Socket Flow

Client → socket.emit("new_message") → Server → room broadcast → All users receive message instantly
Client → socket.emit("typing") → update UI
Server tracks → online users, rooms, groups
🔮 Future Enhancements
Voice messages

Video calling using WebRTC

Online/offline tracking from DB

Story feature

Chat themes

User blocking/reporting system

📜 License
MIT License (or your choice)

👨‍💻 Developer
Divesh Pandey
Full-Stack Developer | CSE Engineer
