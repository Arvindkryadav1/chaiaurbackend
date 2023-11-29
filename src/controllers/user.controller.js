import  { asyncHandler }  from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js"
import { User } from "../models/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler( async (req, res)=>{
   // get user details from the frontend
   const {fullname, email, username, password} = req.body
   console.log("email ", email)
   console.log("fullname ", fullname)


   // validation- not empty
   if (
     [fullname, email, username, password].some((field)=> field?.trim()==="")
   ) 
   {
    throw new apiError(400, "All fields are required")
   }

   // check if the user already exists - username and email
   const existedUser =  await User.findOne({
    $or: [{ username }, { email }]
   })
   if (existedUser) {
    throw new apiError(409, "You are already registered")
   }

   // check for images, check for avatar

  const avatarlocalPath =  req.files?.avatar[0]?.path
  // const coverImageLocalPath = req.files?.coverImage[0]?.path

  let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }

  if (!avatarlocalPath) {
    throw new apiError(400, "Avatar is required")
  }
   
   // upload them to cloudinary

   const avatar = await uploadOnCloudinary(avatarlocalPath)
   const coverImage = await uploadOnCloudinary(coverImageLocalPath)

   if(!avatar) {
    throw new apiError(400, "Avatar is required")
   }
   // create user object - create entry into db

   const user = await User.create({
    fullname,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase()
   })
   // check for user creation
   const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
    )
   // remove password and refresh token field from response
   if(!createdUser) {
    throw new apiError(500, "Something wenty wrong while registering the user")
   }
   
   // return res

   return res.status(201).json(
    new ApiResponse(200, createdUser, "User registered successfully" )
   )
  
})




export { registerUser }