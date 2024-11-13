import User from "../models/user.model.js";
import bcryptjs from "bcryptjs";
import { errorHandler } from "../utils/error.js";
import jwt from "jsonwebtoken";

// USER AUTH ROUTES ---------------------------------------------------------------------

// Signup function for creating a super admin user
export const signup = async (req, res, next) => {
  const { email, password } = req.body;
  const hashedPassword = bcryptjs.hashSync(password, 10);

  console.log(email,password);
  
//   const newUser = new User({
//     email,
//     password: hashedPassword,
//     role: 'superadmin',
//   });

//   try {
//     await newUser.save();
//     res.status(201).json("Superadmin created successfully");
//   } catch (error) {
//     next(error);
//   }
};

// Signin function for authenticating super admin user
export const signin = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    const validUser = await User.findOne({ email, role: 'superadmin' });

    if (!validUser) return next(errorHandler(404, "User not found"));

    const validPassword = bcryptjs.compareSync(password, validUser.password);

    if (!validPassword) return next(errorHandler(401, "Wrong Credentials"));

    const token = jwt.sign({ id: validUser._id, role: validUser.role }, process.env.JWT_SECRET);

    const { password: pass, ...rest } = validUser._doc;

    res
      .cookie("access_token", token, { httpOnly: true })
      .status(200)
      .json(rest);
  } catch (error) {
    next(error);
  }
};

// Google Sign-In (if applicable)
export const googleSignIn = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });

    if (user) {
      const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET);

      const { password: pass, ...rest } = user._doc;

      res
        .cookie("access_token", token, { httpOnly: true })
        .status(200)
        .json(rest);
    } else {
      const generatedPassword = Math.random().toString(36).slice(-8);
      const hashedPassword = bcryptjs.hashSync(generatedPassword, 10);

      const newUser = new User({
        email: req.body.email,
        password: hashedPassword,
        role: 'superadmin',
      });

      await newUser.save();

      const token = jwt.sign({ id: newUser._id, role: newUser.role }, process.env.JWT_SECRET);

      const { password: pass, ...rest } = newUser._doc;

      res
        .cookie("access_token", token, { httpOnly: true })
        .status(200)
        .json(rest);
    }
  } catch (error) {
    next(error);
  }
};

// Signout function
export const signout = async (req, res, next) => {
  try {
    res.clearCookie("access_token");
    res.status(200).json("User has been signed out");
  } catch (error) {
    next(error);
  }
};
