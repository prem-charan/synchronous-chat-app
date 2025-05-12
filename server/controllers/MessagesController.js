import Message from "../models/MessagesModel.js";
import { cloudinary } from "../config/cloudinary.js";

export const getMessages = async (request, response) => {
  try {
    const { id } = request.body;
    const userId = request.userId; // Get from auth middleware
    
    if (!id) {
      return response.status(400).json({ 
        success: false, 
        message: "Chat ID is required" 
      });
    }

    const messages = await Message.find({
      $or: [
        { sender: userId, recipient: id },
        { sender: id, recipient: userId },
      ],
    })
      .populate("sender", "firstName lastName email image color")
      .populate("recipient", "firstName lastName email image color")
      .sort({ timestamp: 1 });

    response.status(200).json({
      success: true,
      messages: messages.map(msg => ({
        ...msg.toObject(),
        timestamp: msg.timestamp || msg.createdAt
      }))
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    response.status(500).json({ 
      success: false, 
      message: "Failed to fetch messages" 
    });
  }
};

export const uploadFile = async (request, response) => {
  try {
    if (!request.file) {
      return response.status(400).json({ 
        success: false, 
        message: "No file uploaded" 
      });
    }

    const fileUrl = request.file.path;
    const fileType = request.file.mimetype;
    const fileName = request.file.originalname;

    response.status(200).json({ 
      success: true,
      fileUrl,
      fileType,
      fileName
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    response.status(500).json({ 
      success: false, 
      message: "Failed to upload file" 
    });
  }
};