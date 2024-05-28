import { catchAsyncError } from "../middlewares/catchAsyncError.js"
import ErrorHandler from "../middlewares/error.js"
import { User } from "../models/userSchema.js"
import cloudinary from "cloudinary"
import { sendToken } from "../utils/jwtToken.js"
import { json } from "express"

export const register = catchAsyncError(async (req, res, next) => {
  if (!req.files || Object.keys(req.files).length === 0) {
    return next(new ErrorHandler("User Avatar Required", 400))
  }
  const { avatar } = req.files
  const allowedFormats = ["image/png", "image/jpeg", "image/webp", "image/avif"]

  if (!allowedFormats.includes(avatar.mimetype)) {
    return next(
      new ErrorHandler("Please provide avatar in png, jpeg, webp, avif", 400)
    )
  }
  const { name, email, phone, password } = req.body
  if (!name || !email || !phone || !password) {
    return next(new ErrorHandler("Please fill full form", 400))
  }
  let user = await User.findOne({ email })
  if (user) {
    return next(new ErrorHandler("User already exist!", 400))
  }
  const cloudinaryResponse = await cloudinary.uploader.upload(
    avatar.tempFilePath
  )
  if (!cloudinaryResponse || cloudinary.error) {
    console.log(
      "Cloudinary Error",
      cloudinaryResponse.error || "Unknown Cloudinary Error"
    )
  }
  user = await User.create({
    name,
    email,
    phone,
    password,
    avatar: {
      public_id: cloudinaryResponse.public_id,
      url: cloudinaryResponse.url,
    },
  })
  sendToken("User Registered!", user, res, 200)
})
export const login = catchAsyncError(async (req, res, next) => {
  const { email, password } = req.body
  if (!email || !password) {
    return next(new ErrorHandler("Please provide email and password", 400))
  }

  const user = await User.findOne({ email }).select("+password")
  if (!user) {
    return next(new ErrorHandler("Invalid email or password", 400))
  }
  const isPasswordMatched = await user.comparePassword(password)
  if (!isPasswordMatched) {
    return next(new ErrorHandler("Invalid email or password", 400))
  }

  sendToken("User Logedin!", user, res, 200)
})
export const logout = catchAsyncError((req, res, next) => {
  res
    .status(200)
    .cookie("token", "", {
      expires: new Date(Date.now()),
      httpOnly: true,
    })
    .json({
      success: true,
      message: "User Loged Out!",
    })
})
export const myProfile = catchAsyncError((req, res, next) => {
  const user = req.user
  res.status(200).json({
    success: true,
    user,
  })
})
