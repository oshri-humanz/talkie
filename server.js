const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.static(path.join(__dirname, "public")));

const users = new Map();

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  users.set(socket.id, {
    id: socket.id,
    name: `User ${socket.id.substring(0, 6)}`,
    isTalking: false,
    inPrivateChat: null // Track if user is in a private chat
  });

  socket.emit("users", Array.from(users.values()));
  socket.broadcast.emit("userJoined", users.get(socket.id));

  socket.on("setName", (name) => {
    const user = users.get(socket.id);
    if (user) {
      user.name = name;
      users.set(socket.id, user);
      io.emit("userUpdated", user);
    }
  });

  socket.on("startTalking", () => {
    const user = users.get(socket.id);
    if (user) {
      user.isTalking = true;
      users.set(socket.id, user);
      socket.broadcast.emit("userStartedTalking", user);
    }
  });

  socket.on("stopTalking", () => {
    const user = users.get(socket.id);
    if (user) {
      user.isTalking = false;
      users.set(socket.id, user);
      socket.broadcast.emit("userStoppedTalking", user);
    }
  });

  // Private chat events
  socket.on("startPrivateChat", (targetUserId) => {
    console.log(`📞 Private chat request from ${socket.id} to ${targetUserId}`);
    const user = users.get(socket.id);
    const targetUser = users.get(targetUserId);

    console.log(`👤 User requesting: ${user ? user.name : 'Unknown'}`);
    console.log(`🎯 Target user: ${targetUser ? targetUser.name : 'Unknown'}`);

    if (user && targetUser) {
      // Check if target user is already in a private chat
      if (targetUser.inPrivateChat) {
        console.log(`❌ Target user ${targetUser.name} is already in a private chat`);
        socket.emit("privateChatError", { message: "User is already in a private chat" });
        return;
      }

      // Set both users as in private chat
      user.inPrivateChat = targetUserId;
      targetUser.inPrivateChat = socket.id;

      users.set(socket.id, user);
      users.set(targetUserId, targetUser);

      // Notify both users
      socket.emit("privateChatStarted", { targetUser: targetUser });
      socket.to(targetUserId).emit("privateChatStarted", { targetUser: user });

      // Update user list for all clients
      io.emit("users", Array.from(users.values()));

      console.log(`✅ Private chat started between ${user.name} and ${targetUser.name}`);
    } else {
      console.log(`❌ Could not start private chat - user or target user not found`);
    }
  });

  socket.on("endPrivateChat", () => {
    const user = users.get(socket.id);
    if (user && user.inPrivateChat) {
      const targetUserId = user.inPrivateChat;
      const targetUser = users.get(targetUserId);

      if (targetUser) {
        // Remove private chat status from both users
        user.inPrivateChat = null;
        targetUser.inPrivateChat = null;

        users.set(socket.id, user);
        users.set(targetUserId, targetUser);

        // Notify both users
        socket.emit("privateChatEnded");
        socket.to(targetUserId).emit("privateChatEnded");

        // Update user list for all clients
        io.emit("users", Array.from(users.values()));

        console.log(`Private chat ended between ${user.name} and ${targetUser.name}`);
      }
    }
  });

  socket.on("startPrivateTalking", (targetUserId) => {
    const user = users.get(socket.id);
    if (user && user.inPrivateChat === targetUserId) {
      user.isTalking = true;
      users.set(socket.id, user);
      socket.to(targetUserId).emit("userStartedPrivateTalking", user);
    }
  });

  socket.on("stopPrivateTalking", (targetUserId) => {
    const user = users.get(socket.id);
    if (user && user.inPrivateChat === targetUserId) {
      user.isTalking = false;
      users.set(socket.id, user);
      socket.to(targetUserId).emit("userStoppedPrivateTalking", user);
    }
  });

  // WebRTC signaling for private chats
  socket.on("private-offer", (data) => {
    socket.to(data.target).emit("private-offer", {
      offer: data.offer,
      sender: socket.id
    });
  });

  socket.on("private-answer", (data) => {
    socket.to(data.target).emit("private-answer", {
      answer: data.answer,
      sender: socket.id
    });
  });

  socket.on("private-ice-candidate", (data) => {
    socket.to(data.target).emit("private-ice-candidate", {
      candidate: data.candidate,
      sender: socket.id
    });
  });

  // Regular group WebRTC signaling
  socket.on("offer", (data) => {
    socket.to(data.target).emit("offer", {
      offer: data.offer,
      sender: socket.id
    });
  });

  socket.on("answer", (data) => {
    socket.to(data.target).emit("answer", {
      answer: data.answer,
      sender: socket.id
    });
  });

  socket.on("ice-candidate", (data) => {
    socket.to(data.target).emit("ice-candidate", {
      candidate: data.candidate,
      sender: socket.id
    });
  });

  // Keep-alive ping handler
  socket.on("ping", (data) => {
    // Respond with pong to maintain connection
    socket.emit("pong", { timestamp: data.timestamp, serverTime: Date.now() });
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    const user = users.get(socket.id);

    // If user was in private chat, end it
    if (user && user.inPrivateChat) {
      const targetUserId = user.inPrivateChat;
      const targetUser = users.get(targetUserId);

      if (targetUser) {
        targetUser.inPrivateChat = null;
        users.set(targetUserId, targetUser);
        socket.to(targetUserId).emit("privateChatEnded");
      }
    }

    users.delete(socket.id);
    socket.broadcast.emit("userLeft", socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
