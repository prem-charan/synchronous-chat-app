import jwt from "jsonwebtoken";
import User from "../models/UserModel.js";
import { compare } from "bcrypt";
import { renameSync, unlinkSync } from "fs";
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
            return response.status(400).send("Email and Password is required.")
        }
        const user = await User.create({email, password});
        const token = createToken(email, user.id);
        response.cookie("jwt", token, getCookieOptions());
        return response.status(201).json({user:{
            id: user.id,
            email: user.email,
            profileSetup: user.profileSetup,
        },
    });
    } catch (error) {
        console.log({error});
        return response.status(500).send("Internal Server Error");
    }
};

export const login = async (request, response, next) => {
  try {
    const { email, password } = request.body;
    if (!email || !password) {
      return response.status(400).send("Email and Password is required.");
    }
    const user = await User.findOne({ email });
    if(!user) {
        return response.status(404).send("User with the given email not found");
    }
    const auth = await compare(password, user.password);
    if(!auth) {
        return response.status(400).send("Password is incorrect.");
    }
    
    // Create token and set cookie
    const token = createToken(email, user.id);
    const cookieOpts = getCookieOptions();
    
    // Log cookie setup details
    console.log("Setting cookie with options:", cookieOpts);
    response.cookie("jwt", token, cookieOpts);
    
    return response.status(200).json({
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
    console.log('Login error:', error);
    return response.status(500).send("Internal Server Error");
  }
};

export const getUserInfo = async (request, response, next) => {
  try {
    const userData = await User.findById(request.userId);
    if (!userData) {
      return response.status(404).send("User with the given id not found.");
    }

    return response.status(200).json({
      id: userData.id,
      email: userData.email,
      profileSetup: userData.profileSetup,
      firstName: userData.firstName,
      lastName: userData.lastName,
      image: userData.image,
      color: userData.color,
    });
  } catch (error) {
    console.log({ error });
    return response.status(500).send("Internal Server Error");
  }
};

export const updateProfile = async (request, response, next) => {
  try {
    const {userId} = request;
    const {firstName, lastName, color} = request.body;
    if(!firstName || !lastName) {
      return response.status(400).send("Firstname, lastname and color is required.");
    }
    const userData = await User.findByIdAndUpdate(userId, {
      firstName, lastName, color, profileSetup:true
    }, {new: true, runValidators: true});

    // Refresh the token
    const token = createToken(userData.email, userData.id);
    response.cookie("jwt", token, getCookieOptions());
    
    return response.status(200).json({
        id: userData.id,
        email: userData.email,
        profileSetup: userData.profileSetup,
        firstName: userData.firstName,
        lastName: userData.lastName,
        image: userData.image,
        color: userData.color,
    });
  } catch (error) {
    console.log({ error });
    return response.status(500).send("Internal Server Error");
  }
};

export const addProfileImage = async (request, response, next) => {
  try {
    if(!request.file) {
      return response.status(400).send("File is required.");
    }

    const date = Date.now();
    let fileName = "uploads/profiles/" + date + request.file.originalname;
    renameSync(request.file.path, fileName);

    const updatedUser = await User.findByIdAndUpdate(request.userId, {image: fileName}, {new: true, runValidators: true});

    // Refresh the token
    const token = createToken(updatedUser.email, updatedUser.id);
    response.cookie("jwt", token, getCookieOptions());

    return response.status(200).json({
      image: updatedUser.image,
    });
  } catch (error) {
    console.log({ error });
    return response.status(500).send("Internal Server Error");
  }
};

export const removeProfileImage = async (request, response, next) => {
  try {
    const { userId } = request;
    const user = await User.findById(userId);
    
    if(!user) {
      return response.status(404).send("User not found");
    }
    
    if(user.image) {
      unlinkSync(user.image);
    }

    user.image = null;
    await user.save();

    // Refresh the token
    const token = createToken(user.email, user.id);
    response.cookie("jwt", token, getCookieOptions());

    return response.status(200).send("Profile image removed successfully.");
  } catch (error) {
    console.log({ error });
    return response.status(500).send("Internal Server Error");
  }
};

export const logout = async (request, response, next) => {
  try {
    const logoutOptions = getCookieOptions();
    logoutOptions.maxAge = 1;
    
    response.cookie("jwt", "", logoutOptions);
    return response.status(200).send("Logout successfull.");
  } catch (error) {
    console.log({ error });
    return response.status(500).send("Internal Server Error");
  }
};

