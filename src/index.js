//require("dotenv").config({path: './env'}) // can be use like this also 
// import dotenv from "dotenv"
// dotenv.config({ path: "./env" })
// node -v + has script syntax to preload dotenv , which we are using. ref: pakage.json -> script
import app from "./app.js";
import connectDB from "./db/index.js";
connectDB()
    .then(() => {
        app.listen(process.env.PORT || 8000, () => {
            console.log(`app is running on port: ${process.env.PORT}`)
        })
    })
    .catch((err) => {
        console.log(err.message, "ERROR CONNECTING TO THE DB!!!!!!!")
    })









/////////////////////////////////////////////////////
// import mongoose from "mongoose";
// import { DB_NAME } from "constants.js"

// import express from "express"

// const app = express()


//     ; (async () => {
//         try {
//             await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
//             app.on("error", (error) => {
//                 console.log(error, "error")
//                 throw error
//             })

//             app.listen(process.env.PORT, () => {
//                 console.log(`app is listening on port ${process.env.PORT}`)
//             })

//         } catch (error) {
//             console.error("ERROR".error)
//             throw error
//         }
//     })()