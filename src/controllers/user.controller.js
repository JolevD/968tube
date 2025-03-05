import { User } from "../models/user.model.js"
import { ApiError } from "../utils/apiError.js"
import { apiResponse } from "../utils/apiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { uploadFilesOnCloudinary } from "../utils/cloudinary.js"
import jwt from "jsonwebtoken"

const generateAccessAndRefereshTokens = async (userId) => {

    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }


    } catch (error) {
        throw new ApiError(500, error.message)
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

    if (!(username || email)) {
        throw new ApiError(400, "Incorrect username or email")
    }
    // check for user in db
    const user = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (!user) {
        throw new ApiError(404, "User does not exists")
    }

    // check for  password
    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw new ApiError(401, "invalid password or username")
    }

    // if valid user generate tokens
    const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(user._id)

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
    User.findByIdAndUpdate(req.user._id,
        {
            $set: {
                refreshToken: undefined // removes refresh token 
            }
        },
        {
            new: true // due to this if new response is returned , we get updated value
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    res.status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(
            new apiResponse(200, {}, "User logged out")
        )

})

const regenAccessToken = asyncHandler(async (req, res) => {
    // first we will get the refresh token stored on the client side
    const clientRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!clientRefreshToken) {
        throw new ApiError(400, "unauthorized request")
    }

    // then we will decode the token -> this means to verify that the client refresh token was created by our token key or not  

    try {
        const decodeToken = jwt.verify(clientRefreshToken, process.env.REFRESH_TOKEN_SECRET)

        // now we find the client in the DB

        const user = await User.findById(decodeToken?._id)

        if (!user) {
            throw new ApiError(401, "invalid refresh token")
        }

        // after client is verified now we check the refresh token saved in the DB wrt to client
        if (clientRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "refresh token is expired or invalid")
        }

        // now we will generate new token for the new session

        const { newAccessToken, newRefreshToken } = await generateAccessAndRefereshTokens(user._id)

        // now we set these up for new session

        const options = {
            httpOnly: true,
            secure: true
        }

        return res.status(200)
            .cookie("accessToken", newAccessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new apiResponse(200, { newAccessToken, newRefreshToken }, "new session started")
            )
    } catch (error) {
        throw new ApiError(401, error.message)
    }


})

const resetPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body

    const user = await User.findById(req.user?._id)

    const verifyPassword = await user.isPasswordCorrect(oldPassword)

    if (!verifyPassword) {
        throw new ApiError(400, "Invalid old password")
    }

    user.password = newPassword
    await user.save({ validateBeforeSave: false })

    return res.status(200)
        .json(new apiResponse(200, {}, "Password changed successfully")
        )
})

const accountDetailsUpdate = asyncHandler(async (req, res) => {
    const { fullname, email } = req.body

    if (!(email || fullname)) {
        throw new ApiError(400, "Fill empty fields")
    }
    const user = await User.findByIdAndUpdate(req.user?._id, {
        $set: {
            fullname,
            email
        }
    },
        { new: true } // this returns the updated user
    ).select("-password")

    return res.status(200)
        .json(new apiResponse(200, user, "Details successfully updated"))

})

const updateUserAvatar = asyncHandler(async (req, res) => {

    const avatarLocalPath = req.file?.path

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file missing")
    }
    const avatar = await uploadFilesOnCloudinary(avatarLocalPath)

    if (!avatar.url) {
        throw new ApiError(400, "Eror file uploading file on cloudinary")
    }

    const user = await User.findByIdAndUpdate(req.user?._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        { new: true }
    ).select("-password")

    return res.status(200)
        .json(new apiResponse(200, user, "Avatar changed successfully")
        )

})


const updateUserCoverImage = asyncHandler(async (req, res) => {

    const coverImageLocalPath = req.file?.path

    if (!coverImageLocalPath) {
        throw new ApiError(400, "Avatar file missing")
    }
    const coverImage = await uploadFilesOnCloudinary(coverImageLocalPath)

    if (!coverImage.url) {
        throw new ApiError(400, "Eror file uploading file on cloudinary")
    }

    const user = await User.findByIdAndUpdate(req.user?._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        { new: true }
    ).select("-password")

    return res.status(200)
        .json(new apiResponse(200, user, "Cover Image changed successfully")
        )

})

const userChannetProfile = asyncHandler(async (req, res) => {
    // we take username from the parameters
    const { username } = req.params

    if (!username) {
        throw new ApiError(401, "User is missing")
    }
    const channelProfile = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase()
            } // this is to pick out specific user
        },
        {
            $lookup: {
                from: "subscriptions",  // the name how it is saved in mongo db
                localField: "_id",  // field from the current model on which we are using aggregation and which is cimmected to the subscription model
                foreignField: "channel", // same as how it is defined in the model
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",  // the name how it is saved in mongo db
                localField: "_id",  // field from the current model on which we are using aggregation and which is cimmected to the subscription model
                foreignField: "subscriber", // same as how it is defined in the model
                as: "subscribedTO"
            }
        },
        {
            $addFields: {
                subscriberCount: {
                    $size: "$subscribers" // $ sign because we have defined them as fields above
                },
                channelSubscribedToCount: {
                    $size: "$subscribedTO"
                },
                isSubscribed: {
                    $cond: {
                        if: { $in: [req.user?._id, "$subscribers.subscriber"] }, // this is for the user's channel sub detail, like if the visiting user is subed to the user's channel or not in true or false form
                        then: true,
                        else: false
                    }
                }

            }
        },

        {
            $project: {
                fullname: 1,
                username: 1,
                avatar: 1,
                coverImage: 1,
                email: 1,
                subscriberCount: 1,
                channelSubscribedToCount: 1,
                isSubscribed: 1
            } // this is for what info is to send after database operations
        }

    ])

    if (!channelProfile.length) {
        throw new ApiError(404, "channel does not exist")
    }

    res.status(200).
        json(new apiResponse(200, channelProfile[0], `${username} profile data fetched successfully`))
})

export {
    registerUser,
    loginUser,
    logoutUser,
    regenAccessToken,
    resetPassword,
    accountDetailsUpdate,
    updateUserAvatar,
    updateUserCoverImage,
    userChannetProfile
}