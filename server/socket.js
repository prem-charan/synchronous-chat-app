import { Server as SocketIOServer } from "socket.io";
import Message from "./models/MessagesModel.js";
import Channel from "./models/ChannelModel.js";

const setupSocket = (server) => {
  const io = new SocketIOServer(server, {
    cors: {
      origin: function(origin, callback) {
        if (!origin) return callback(null, true);
        
        const allowedOrigins = process.env.NODE_ENV === 'production' 
            ? [process.env.CLIENT_URL]
            : ['http://localhost:5173', process.env.CLIENT_URL];
        
        if (allowedOrigins.includes(origin) || origin.includes('vercel.app')) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      credentials: true,
      allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'x-auth-token', 'Accept'],
      exposedHeaders: ['Set-Cookie']
    },
  });

  const userSocketMap = new Map();

  const sendChannelMessage = async (message) => {
    const { channelId, sender, content, messageType, fileUrl } = message;

    const createdMessage = await Message.create({
      sender,
      recipient: null,
      content,
      messageType,
      timestamp: new Date(),
      fileUrl,
    });

    const messageData = await Message.findById(createdMessage._id)
      .populate("sender", "id email firstName lastName image color")
      .exec();

    await Channel.findByIdAndUpdate(channelId, {
      $push: { messages: createdMessage._id },
    });

    const channel = await Channel.findById(channelId).populate("members");

    const finalData = { ...messageData._doc, channelId: channel._id };

    if (channel && channel.members) {
      channel.members.forEach((member) => {
        const memberSocketId = userSocketMap.get(member._id.toString());
        if (memberSocketId) {
          io.to(memberSocketId).emit("receive-channel-message", finalData);
        }
      });
      const adminSocketId = userSocketMap.get(channel.admin._id.toString());
      if (adminSocketId) {
        io.to(adminSocketId).emit("receive-channel-message", finalData);
      }
    }
  };

  io.on("connection", (socket) => {
    const userId = socket.handshake.query.userId;
    if (!userId) {
      socket.disconnect();
      return;
    }

    // Store user's socket ID and log connection
    userSocketMap.set(userId, socket.id);
    console.log(`User connected: ${userId} with socket ID: ${socket.id}`);

    socket.on("sendMessage", async (message) => {
      try {
        const senderSocketId = userSocketMap.get(message.sender);
        const recipientSocketId = userSocketMap.get(message.recipient);

        const createdMessage = await Message.create(message);
        const messageData = await Message.findById(createdMessage._id)
          .populate("sender", "id email firstName lastName image color")
          .populate("recipient", "id email firstName lastName image color");

        // Emit to both parties
        if (recipientSocketId) {
          io.to(recipientSocketId).emit("receiveMessage", messageData);
        }
        if (senderSocketId) {
          io.to(senderSocketId).emit("receiveMessage", messageData);
        }
      } catch (error) {
        console.error("Message handling error:", error);
      }
    });

    socket.on("send-channel-message", sendChannelMessage);
    socket.on("disconnect", () => {
      for (const [userId, socketID] of userSocketMap.entries()) {
        if (socketID === socket.id) {
          userSocketMap.delete(userId);
          console.log(`User disconnected: ${userId} (socket ID: ${socket.id})`);
          break;
        }
      }
    });
  });
};

export default setupSocket;
