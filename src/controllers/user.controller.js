import { User } from "../models/user.model.js"
import { ApiError } from "../utils/apiError.js"
import { apiResponse } from "../utils/apiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { uploadFilesOnCloudinary } from "../utils/cloudinary.js"


const generateAccessTokenAndRefreshToken = async (userId) => {

    try {
        const user = User.findById(userId)
        const accessToken = await user.generateAccessToken()
        const refreshToken = await user.generateRefreshToken()

        user.refreshToken = refreshToken
        user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }

    } catch (error) {
        console.log(error)
        throw new ApiError(500, "error while creating tokens")
    }


}


const registerUser = asyncHandler(async (req, res) => {
    const { username, password, email, fullname } = req.body

    if ([username, password, email, fullname].some((field) => !field || field?.trim() === "")) {  // revise .some method 
        throw new ApiError(400, "All fields required")
    }

    const existingUser = await User.findOne({
        $or: [{ username }, { email }]  // $or is a mongoDB operator which can check for both conditions at the same time here
    })

    if (existingUser) {
        throw new ApiError(409, "user already exists")
    }

    const avatarLocalPath = req.files.avatar?.[0]?.path // here req comes from the multer middleware which adds the files fields so we have to check if the file or spcifically the local avatar file path is available or not. same for the coverimage 

    const coverImageLocalPath = req.files.coverImage?.[0]?.path  // revise the index property here
    // above line has a problem -> as coverimage is not required while creating the user we should have to define the path in a different way so that the path becomes empty if  user doesnot sends the coverimage 

    // let coverImageLocalPath;
    // if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
    //     coverImageLocalPath = req.files.coverImage[0].path
    // }



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


const loginUser = asyncHandler(async (req, res) => {
    const { username, email, password } = req.body

    // check for user in db
    const user = User.findOne({
        $or: [{ username }, { email }]
    })

    if (!user) {
        throw new ApiError(404, "User does not exists")
    }

    // check for  password
    const isPasswordCorrect = await user.isPasswordCorrect(password)

    if (!isPasswordCorrect) {
        throw new ApiError(401, "invalid password or username")
    }

    // if valid user generate tokens
    const { accessToken, refreshToken } = await generateAccessTokenAndRefreshToken(user._id)

    //update user 
    const loggedUser = await User.findById(user._id).select("-password -refreshToken")

    console.log(loggedUser);

    const options = {
        httpOnly: true,
        secure: true
    }

    res.status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new apiResponse(200, {
                loggedUser, accessToken, refreshToken
            },
                "User logged in successfully")
        )


})

const logoutUser = asyncHandler(async (req, res) => {

})

export { registerUser, loginUser }