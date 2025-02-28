import { User } from "../models/user.model.js"
import { ApiError } from "../utils/apiError.js"
import jwt from "jsonwebtoken"
import { asyncHandler } from '../utils/asyncHandler.js';

export const verifyJWT = asyncHandler(async (req, res, next) => {
    try {
        // first we need the current logined in user's token

        const token = req.cookies?.accessToken || req.headers("authorization").replace("Bearer ", "")

        if (!token) {
            throw new ApiError(401, "Unauthorized request")
        }
        // now we need to match the user token with our original key
        const verifiedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

        if (!verifiedToken) {
            throw new ApiError(404, "access token did not match")
        }

        // now we need to locate the user with the verified token
        const user = await User.findById(verifiedToken?._id).select("-password -refreshToken")

        if (!user) {
            throw new ApiError(400, "user not found via token")
        }

        req.user = user

        next()
    } catch (error) {
        throw new ApiError(401, error.message)
    }

})

