import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";

const router = Router()

router.route("/register").post(registerUser) // gets here from the app.js and the gets to the /register route from this

export default router