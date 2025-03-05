import { Router } from "express";
import { registerUser, loginUser, logoutUser, regenAccessToken, resetPassword, updateUserAvatar, updateUserCoverImage, updateAccountDetails, userChannetProfile, userWatchHistory, getCurrentUser } from "../controllers/user.controller.js";
import { upload } from "../middleware/multer.middleware.js";
import { verifyJWT } from '../middleware/auth.middleware.js';
const router = Router()

router.route("/register").post(upload.fields([
    {
        name: "avatar",
        maxCount: 1
    },
    {
        name: "coverImage",
        maxCount: 1
    }
]), registerUser) // gets here from the app.js and the gets to the /register route from this

router.route("/login").post(loginUser)

// secured route

router.route("/logout").post(verifyJWT, logoutUser)

router.route("/refresh-token").post(regenAccessToken)

router.route("/reset-password").post(verifyJWT, resetPassword)

router.route("/current-user").get(verifyJWT, getCurrentUser)

router.route("/update-user-details").post(verifyJWT, updateAccountDetails)

router.route("/update-avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar)

router.route("/update-cover-image").patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage)

router.route("/c/:username").get(verifyJWT, userChannetProfile)

router.route("/user/watch-history").get(verifyJWT, userWatchHistory)

export default router