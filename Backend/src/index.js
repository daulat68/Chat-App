import express from  "express";
import dotenv from "dotenv"
import cookieParser from "cookie-parser"
import { connectDB } from "./lib/db.js";
import authRoutes from "./routes/auth.route.js"
import messageRoutes from "./routes/message.route.js"
import cors from "cors"
import { app, server } from "./lib/socket.js";

dotenv.config()

const PORT= process.env.PORT || 5001

app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));

app.use(cookieParser())
app.use(
    cors({
        // origin: "*",
        origin: "http://localhost:5173",
        credentials: true,
    }
))

app.use("/api/auth", authRoutes)
app.use("/api/messages", messageRoutes)

server.listen(5001, ()=>{
    console.log(`Server is listening on PORT: ${PORT}`)
    connectDB()
});