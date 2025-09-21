import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";
import redisClient from "../lib/redis.js";


export const getUsersForSidebar = async (req, res) => {
    try {
        const loggedInUserId = req.user._id;
        const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } }).select("-password -createdAt -updatedAt -__v -email");

        res.status(200).json(filteredUsers);
    } catch (error) {
        console.error("Error in getUsersForSidebar:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};


export const getMessages = async (req, res) => {
    try {
        const { id: userToChatId } = req.params;
        const myId = req.user._id;

        // Create a unique chat key
        const chatKey = `chat:${[myId.toString(), userToChatId.toString()].sort().join("_")}`;

        // Try Redis first
        const cachedMessages = await redisClient.get(chatKey);
        if (cachedMessages) {
        return res.status(200).json(JSON.parse(cachedMessages));
        }

        // If not in cache, fetch from MongoDB
        const messages = await Message.find({
        $or: [
            { senderId: myId, receiverId: userToChatId },
            { senderId: userToChatId, receiverId: myId },
        ],
        }).sort({ createdAt: 1 });

        // Save to Redis with 2 hour expiry
        await redisClient.setEx(chatKey, 60 * 60 * 2, JSON.stringify(messages));

        res.status(200).json(messages);
    } catch (error) {
        console.log("Error in getMessages controller: ", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};



export const sendMessage = async (req, res) => {
    try {
        const { text, image } = req.body;
        const { id: receiverId } = req.params;
        const senderId = req.user._id;

        let imageUrl;
        if (image) {
        const uploadResponse = await cloudinary.uploader.upload(image);
        imageUrl = uploadResponse.secure_url;
        }

        const newMessage = new Message({
        senderId,
        receiverId,
        text,
        image: imageUrl,
        });

        await newMessage.save();

        // Build Redis chat key
        const chatKey = `chat:${[senderId.toString(), receiverId.toString()].sort().join("_")}`;

        // Fetch cached messages (if any), add new one, then reset cache with 2h expiry
        const cachedMessages = await redisClient.get(chatKey);
        let updatedMessages = [];
        if (cachedMessages) {
        updatedMessages = JSON.parse(cachedMessages);
        }
        updatedMessages.push(newMessage);

        await redisClient.setEx(chatKey, 60 * 60 * 2, JSON.stringify(updatedMessages));

        // Emit via Socket.IO
        const receiverSocketId = getReceiverSocketId(receiverId);
        if (receiverSocketId) {
        io.to(receiverSocketId).emit("newMessage", newMessage);
        }

        res.status(201).json(newMessage);
    } catch (error) {
        console.log("Error in sendMessage controller:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};