import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
import authRoutes from "./routes/AuthRoutes.js";
import contactsRoutes from "./routes/ContactRoutes.js";
import setupSocket from "./socket.js";
import messagesRoutes from "./routes/MessagesRoutes.js";
import channelRoutes from "./routes/ChannelRoutes.js";
import { profileUpload, fileUpload } from "./config/multer.js";

// Load environment variables first
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3001;
const databaseURL = process.env.DATABASE_URL;

// Configure CORS with specific options
const corsOptions = {
    origin: function(origin, callback) {
        // Allow requests with no origin (like mobile apps, curl requests)
        if (!origin) return callback(null, true);
        
        const allowedOrigins = process.env.NODE_ENV === 'production' 
            ? [process.env.CLIENT_URL]
            : ['http://localhost:5173', process.env.CLIENT_URL];
        
        // Check if the origin is allowed or if it contains vercel.app (for preview deployments)
        console.log(`Checking CORS for origin: ${origin}`);
        if (allowedOrigins.includes(origin) || origin.includes('vercel.app')) {
            callback(null, true);
        } else {
            console.log(`CORS blocked origin: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'x-auth-token', 'Accept'],
    exposedHeaders: ['Set-Cookie'],
    preflightContinue: false,
    optionsSuccessStatus: 204
};

// Apply middleware
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json());

// Error handling middleware for multer
app.use((err, req, res, next) => {
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        message: 'File size too large. Maximum size is 5MB.',
        success: false 
      });
    }
    return res.status(400).json({ 
      message: err.message,
      success: false 
    });
  }
  next(err);
});

// Apply routes
app.use("/api/auth", authRoutes);
app.use("/api/contacts", contactsRoutes);
app.use("/api/messages", messagesRoutes);
app.use("/api/channel", channelRoutes); 

// Connect to MongoDB
mongoose
    .connect(databaseURL)
    .then(() => {
        console.log('DB Connection Successful!');
        // Start server only after DB connection is established
        const server = app.listen(port, () => {
            console.log(`Server is running at http://localhost:${port}`);
        });
        // Setup socket.io after server is created
        setupSocket(server);
    })
    .catch((err) => {
        console.error('DB Connection Error:', err.message);
        process.exit(1);
    });

// test