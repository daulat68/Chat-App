import express from  "express";
import dotenv from "dotenv"
import cookieParser from "cookie-parser"
import { connectDB } from "./lib/db.js";
import authRoutes from "./routes/auth.route.js"
import messageRoutes from "./routes/message.route.js"
import cors from "cors"
dotenv.config()
const app = express();
const PORT= process.env.PORT || 5000

app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));

app.use(cookieParser())
app.use(
    cors({
        origin: "http://localhost:5173",
        credentials: true,
    }
))
app.use("/api/auth", authRoutes)
app.use("/api/message", messageRoutes)

app.listen(5001, ()=>{
    console.log(`Server is listening on PORT: ${PORT}`)
    connectDB()
});