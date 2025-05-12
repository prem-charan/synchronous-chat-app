import jwt from "jsonwebtoken";
import User from "../models/UserModel.js";
import { compare } from "bcrypt";
import { cloudinary } from "../config/cloudinary.js";

const maxAge = 3 * 24 * 60 * 60 * 1000;

const createToken = (email, userId) => {
    return jwt.sign({email, userId}, process.env.JWT_KEY, {expiresIn: maxAge})
};

// Create a dynamic cookie options function to handle both production and development
const getCookieOptions = () => {
    const options = {
        maxAge,
        httpOnly: true,
        secure: true,
        sameSite: 'None',
        path: '/',
    };
    
    // Only add domain if specified in environment
    if (process.env.COOKIE_DOMAIN && process.env.COOKIE_DOMAIN.trim() !== '') {
        options.domain = process.env.COOKIE_DOMAIN;
    }
    
    return options;
};

export const signup = async (request, response, next) => {
    try {
        const {email, password } = request.body;
        if(!email || !password) {
            return response.status(400).json({
                message: "Email and Password is required.",
                success: false
            });
        }
        const user = await User.create({email, password});
        const token = createToken(email, user.id);
        response.cookie("jwt", token, getCookieOptions());
        return response.status(201).json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                profileSetup: user.profileSetup,
            }
        });
    } catch (error) {
        console.error("Signup error:", error);
        return response.status(500).json({
            message: "Internal Server Error",
            success: false
        });
    }
};

export const login = async (request, response, next) => {
  try {
    const { email, password } = request.body;
    if (!email || !password) {
      return response.status(400).json({
        message: "Email and Password is required.",
        success: false
      });
    }
    const user = await User.findOne({ email });
    if(!user) {
        return response.status(404).json({
            message: "User with the given email not found",
            success: false
        });
    }
    const auth = await compare(password, user.password);
    if(!auth) {
        return response.status(400).json({
            message: "Password is incorrect.",
            success: false
        });
    }
    
    const token = createToken(email, user.id);
    const cookieOpts = getCookieOptions();
    response.cookie("jwt", token, cookieOpts);
    
    return response.status(200).json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        profileSetup: user.profileSetup,
        firstName: user.firstName,
        lastName: user.lastName,
        image: user.image,
        color: user.color,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return response.status(500).json({
      message: "Internal Server Error",
      success: false
    });
  }
};

export const getUserInfo = async (request, response, next) => {
  try {
    const userData = await User.findById(request.userId);
    if (!userData) {
      return response.status(404).json({
        message: "User with the given id not found.",
        success: false
      });
    }

    return response.status(200).json({
      success: true,
      id: userData.id,
      email: userData.email,
      profileSetup: userData.profileSetup,
      firstName: userData.firstName,
      lastName: userData.lastName,
      image: userData.image,
      color: userData.color,
    });
  } catch (error) {
    console.error("Get user info error:", error);
    return response.status(500).json({
      message: "Internal Server Error",
      success: false
    });
  }
};

export const updateProfile = async (request, response, next) => {
  try {
    const {userId} = request;
    const {firstName, lastName, color} = request.body;
    if(!firstName || !lastName) {
      return response.status(400).json({
        message: "Firstname, lastname and color is required.",
        success: false
      });
    }
    const userData = await User.findByIdAndUpdate(userId, {
      firstName, lastName, color, profileSetup:true
    }, {new: true, runValidators: true});

    const token = createToken(userData.email, userData.id);
    response.cookie("jwt", token, getCookieOptions());
    
    return response.status(200).json({
      success: true,
      id: userData.id,
      email: userData.email,
      profileSetup: userData.profileSetup,
      firstName: userData.firstName,
      lastName: userData.lastName,
      image: userData.image,
      color: userData.color,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    return response.status(500).json({
      message: "Internal Server Error",
      success: false
    });
  }
};

export const addProfileImage = async (request, response) => {
  try {
    if (!request.file) {
      return response.status(400).json({ 
        success: false,
        message: "No image uploaded" 
      });
    }

    const user = await User.findById(request.userId);
    if (!user) {
      return response.status(404).json({ 
        success: false,
        message: "User not found" 
      });
    }

    // Delete old image from Cloudinary if it exists
    if (user.image) {
      try {
        const publicId = user.image.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(publicId);
      } catch (error) {
        console.error("Error deleting old image:", error);
        // Continue with the update even if old image deletion fails
      }
    }

    // Update user with new Cloudinary URL
    user.image = request.file.path;
    await user.save();

    // Return the complete user data
    return response.status(200).json({ 
      success: true,
      message: "Profile image updated successfully",
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        image: user.image,
        color: user.color,
        profileSetup: user.profileSetup
      }
    });
  } catch (error) {
    console.error("Profile image update error:", error);
    return response.status(500).json({ 
      success: false,
      message: "Failed to update profile image. Please try again." 
    });
  }
};

export const removeProfileImage = async (request, response) => {
  try {
    const user = await User.findById(request.userId);
    if (!user) {
      return response.status(404).json({ 
        success: false,
        message: "User not found" 
      });
    }

    if (user.image) {
      try {
        // Delete image from Cloudinary
        const publicId = user.image.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(publicId);
        
        // Remove image URL from user document
        user.image = null;
        await user.save();

        return response.status(200).json({ 
          success: true,
          message: "Profile image removed successfully",
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            image: user.image,
            color: user.color,
            profileSetup: user.profileSetup
          }
        });
      } catch (error) {
        console.error("Error deleting image from Cloudinary:", error);
        return response.status(500).json({ 
          success: false,
          message: "Failed to delete image from storage" 
        });
      }
    }

    return response.status(200).json({ 
      success: true,
      message: "No profile image to remove",
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        image: user.image,
        color: user.color,
        profileSetup: user.profileSetup
      }
    });
  } catch (error) {
    console.error("Profile image removal error:", error);
    return response.status(500).json({ 
      success: false,
      message: "Failed to remove profile image" 
    });
  }
};

export const logout = async (request, response, next) => {
  try {
    const logoutOptions = getCookieOptions();
    logoutOptions.maxAge = 0;
    logoutOptions.expires = new Date(0); // Ensure cookie is expired
    response.cookie("jwt", "", logoutOptions);
    response.clearCookie("jwt", logoutOptions);
    return response.status(200).json({ 
      message: "Logout successful",
      success: true 
    });
  } catch (error) {
    console.log({ error });
    return response.status(500).json({ 
      message: "Internal Server Error",
      success: false 
    });
  }
};

