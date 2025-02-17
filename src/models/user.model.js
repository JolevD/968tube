import mongoose, { Schema } from "mongoose";

const userSchema = new Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true // used for better search (ref to vid/doc for more details)
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        fullname: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
        },
        avatar: {
            type: String, // from cloudinary 
            required: true,
        },
        coverImage: {
            type: String, // from cloudinary 
        },
        password: {
            type: String,
            required: [true, "password is required"]
        },
        refreshToken: {
            type: String,

        },
        watchHistory: [
            {
                type: Schema.Types.ObjectId,
                ref: "Video"
            }
        ]
    },
    {
        timestamps: true
    }
)

export const user = mongoose.model("User", userSchema) 