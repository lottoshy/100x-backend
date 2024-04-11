import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"

const generateAccessAndRefreshToken = async(userId) =>{
    try {
        const user = await User.findOne(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.genreateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({validateBeforeSave: false})

        return {accessToken, refreshToken}
    } catch (error) {
        throw new ApiError(500, "Something went wrong while genreating refresh and access tokens")
    }
}

const registerUser = asyncHandler(async (req,res)=>{
    // get user details from frontend
    // validation - not empty
    // check if user already exists: username, email
    // check for images, check for avatar
    // upload them to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return res

    const {name, email, dob, username, password} = req.body

    if([name, email, dob, username, password].some((field)=> field?.trim() === "") === ""){
        throw new ApiError(400, "Please fill all the fields")
    }

    const existedEmail = User.findOne({email})
    if(existedEmail){
        throw new ApiError(409, "User with this email already exist.")
    }

    const existedUsername = User.findOne({username})
    if(existedUsername){
        throw new ApiError(409, "username is already taken.")
    }
    // const profileLocalPath = req.files?.profile[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;

    // if(!profileLocalPath){
    //     throw new ApiError(400, "Profile file is required")
    // }

    // const profile = await uploadOnCloudinary(profileLocalPath)
    // const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    // if(!profile){
    //     throw new ApiError(400, "Profile file is required")
    // }

    const user = await User.create({
        name,
        // profile: profile.url,
        // coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase(),
        dob
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser){
        throw new ApiError(400, "Something went wrong while registering user.")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully")
    )
})

const loginUser = asyncHandler(async (req,res)=>{
    const {email, username, password} = req.body

    if(!username || !email){
        throw new ApiError(400, "Username or email is required.")
    }

    const user = await User.findOne({
        $or: [{username}, {email}]
    })

    if(!user){
        throw new ApiError(404, "User does not exist")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new ApiError(401, "Invalid user credentials")
    }

    const {accessToken, refreshToken} =await generateAccessAndRefreshToken(user._id)

    const loggedInUser = await User.findById(user._id)
    .select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(200,
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "User loggedIn successfully")
    )
})

const logoutUser = asyncHandler(async(req, res) => {
    await User.findByIdAndUpdate(req.user._id, {
        $set: {
            refreshToken: undefined
        }
    },
    {
        new: true
    }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out successfully"))
})


export {
    registerUser,
    loginUser,
    logoutUser
}