import { Router } from "express";
import { registerUser, loginUser, logoutUser, regenAccessToken } from "../controllers/user.controller.js";
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

export default router