import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";
import redisClient from '../lib/redis.js';

// Save a message to Redis cache
export async function saveMessageToCache(chatId, message) {
    await redisClient.rPush(`chat:${chatId}:messages`, JSON.stringify(message));
    // Keep only the latest 50 messages
    await redisClient.lTrim(`chat:${chatId}:messages`, -50, -1);
    // Optional TTL to auto-expire inactive chats (2 HOURS)
    await redisClient.expire(`chat:${chatId}:messages`, 60 * 60 * 2);
}

// Get list of users for sidebar (exclude current user)
export const getUsersForSidebar = async (req, res) => {
    try {
        const loggedInUserId = req.user._id;
        const users = await User.find({ _id: { $ne: loggedInUserId } }).select("-password");
        res.status(200).json(users);
    } catch (error) {
        console.error("Error in getUsersForSidebar:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};

// Get messages for a chat
export const getMessages = async (req, res) => {
    try {
        // const start = Date.now();
        const { id: userToChatId } = req.params;
        const senderId = req.user._id;

        // Create canonical chat ID
        const chatId = [senderId.toString(), userToChatId.toString()].sort().join('_');

        // Try to fetch messages from Redis cache
        const cachedMessages = await redisClient.lRange(`chat:${chatId}:messages`, 0, -1);
        if (cachedMessages.length > 0) {
            const messages = cachedMessages.map(msg => JSON.parse(msg));
            // console.log(`Message fetch (cache) took ${Date.now() - start} ms`);
            return res.status(200).json(messages);
        }

        // Fallback: fetch from MongoDB
        const messages = await Message.find({
            $or: [
                { senderId, receiverId: userToChatId },
                { senderId: userToChatId, receiverId: senderId }
            ]
        }).sort({ createdAt: 1 }).lean();

        // Save to Redis for next time
        if (messages.length > 0) {
            await redisClient.rPush(
                `chat:${chatId}:messages`,
                ...messages.map(msg => JSON.stringify(msg))
            );
            await redisClient.lTrim(`chat:${chatId}:messages`, -50, -1);
            await redisClient.expire(`chat:${chatId}:messages`, 60 * 60 * 24 * 7);
        }

        // console.log(`Message fetch (DB) took ${Date.now() - start} ms`);
        res.status(200).json(messages);

    } catch (error) {
        console.error("Error in getMessages:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};

// Send a new message
export const sendMessage = async (req, res) => {
    try {
        // const start = Date.now();
        const { text, image } = req.body;
        const { id: receiverId } = req.params;
        const senderId = req.user._id;

        let imageUrl;
        if (image) {
            // Upload base64 image to Cloudinary
            const uploadResponse = await cloudinary.uploader.upload(image);
            imageUrl = uploadResponse.secure_url;
        }

        const newMessage = await Message.create({
            senderId,
            receiverId,
            text,
            image: imageUrl
        });

        // Update Redis cache
        const chatId = [senderId.toString(), receiverId.toString()].sort().join('_');
        await saveMessageToCache(chatId, newMessage);

        // Emit message to receiver via Socket.io
        const receiverSocketId = getReceiverSocketId(receiverId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("newMessage", newMessage);
        }

        res.status(201).json(newMessage);
        // console.log(`Message send took ${Date.now() - start} ms`);

    } catch (error) {
        console.error("Error in sendMessage:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};
