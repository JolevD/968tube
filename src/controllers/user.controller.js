import { User } from "../models/user.model.js"
import { ApiError } from "../utils/apiError.js"
import { apiResponse } from "../utils/apiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { uploadFilesOnCloudinary } from "../utils/cloudinary.js"

const registerUser = asyncHandler(async (req, res) => {
    const { username, password, email, fullname } = req.body

    if ([username, password, email, fullname].some((field) => field?.trim() === "")) {  // revise .some method 
        throw new ApiError(400, "All fields required")
    }

    const existingUser = User.findOne({
        $or: [{ username }, { email }]  // $or is a mongoDB operator which can check for both conditions at the same time here
    })

    if (existingUser) {
        throw new ApiError(409, "user already exists")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path // here req comes from the multer middleware which adds the files fields so we have to check if the file or spcifically the local avatar file path is available or not. same for the coverimage 

    const coverImageLocalPath = req.files?.coverImage[0]?.path  // revise the index property here

    if (!avatarLocalPath) {
        throw new ApiError(400, "avatar is required")
    } // checking because the avatar field is required 


    const avatar = await uploadFilesOnCloudinary(avatarLocalPath)
    const coverImage = await uploadFilesOnCloudinary(coverImageLocalPath)

    if (!avatar) {
        throw new ApiError(400, "avatar is required")
    }

    const user = await User.create({
        username: username.toLowerCase(),
        fullname,
        password,
        email,
        avatar: avatar.url,
        coverImage: coverImage?.url || ""
    })

    const createdUser = await User.findById(user._id)?.select("-password -refreshToken")

    if (!createdUser) {
        throw new ApiError(500, "Error while registering user")
    }

    return res.status(201).json(
        new apiResponse(200, createdUser, "User created successfully")
    )

})

export { registerUser }