import Message from "../models/MessagesModel.js";
import { cloudinary } from "../config/cloudinary.js";

export const getMessages = async (request, response, next) => {
  try {
    const { id } = request.body;
    const messages = await Message.find({
      $or: [
        { sender: request.userId, recipient: id },
        { sender: id, recipient: request.userId },
      ],
    })
      .populate("sender", "firstName lastName email image color")
      .populate("recipient", "firstName lastName email image color")
      .sort({ timestamp: 1 });

    return response.status(200).json({ messages });
  } catch (error) {
    console.log({ error });
    return response.status(500).send("Internal Server Error");
  }
};

export const uploadFile = async (request, response, next) => {
  try {
    if(!request.file) {
      return response.status(400).send("File is required.");
    }
    
    // The file URL is already provided by Cloudinary
    const fileUrl = request.file.path;

    return response.status(200).json({ filePath: fileUrl });
  } catch (error) {
    console.log({ error });
    return response.status(500).send("Internal Server Error");
  }
};