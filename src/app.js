import express, { urlencoded } from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app = express()

// configuration using middlewares 
app.use(cors({
    origin: process.env.ORIGIN_URL,
    credentials: true
})) // to connect requests and response from different origins ( common example frontend to backend connection )
app.use(express.json({ limit: "16kb" }))  // for parsing json data
app.use(urlencoded({ extended: true, limit: "16kb" })) // for url data, extended is use for parsing nested objects(not used in general i guess) 
app.use(express.static("public")) // to provide static data directly (example pdf or sample pages)
app.use(cookieParser()) // to perform CRUD operations in url cookies

// import routes 
import userRouter from './routes/user.routes.js';

app.use("/api/v1/users", userRouter)

export default app 