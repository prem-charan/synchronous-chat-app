import Message from "../models/MessagesModel.js";
import { cloudinary } from "../config/cloudinary.js";

export const getMessages = async (request, response) => {
  try {
    const { senderId, recipientId } = request.body;
    const messages = await Message.find({
      $or: [
        { sender: senderId, recipient: recipientId },
        { sender: recipientId, recipient: senderId },
      ],
    })
      .populate("sender", "firstName lastName email image color")
      .populate("recipient", "firstName lastName email image color")
      .sort({ createdAt: 1 });

    response.status(200).json(messages);
  } catch (error) {
    response.status(500).json({ message: error.message });
  }
};

export const uploadFile = async (request, response) => {
  try {
    if (!request.file) {
      return response.status(400).json({ message: "No file uploaded" });
    }

    // The file URL is already provided by Cloudinary in request.file.path
    const fileUrl = request.file.path;

    response.status(200).json({ fileUrl });
  } catch (error) {
    response.status(500).json({ message: error.message });
  }
};