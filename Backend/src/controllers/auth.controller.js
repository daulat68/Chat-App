import { generateToken } from "../lib/utils.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import cloudinary from "../lib/cloudinary.js";
import validator from "validator";
import OTP from "../models/otp.model.js";
import { sendOtpEmail } from "../lib/mailer.js";

export const signup = async (req, res) => {
    try{
        let {fullName, email, password} = req.body
        fullName = fullName?.trim();
        email = email?.trim().toLowerCase();
        password = password?.trim();

        if(!fullName || !email || !password){
            return res.status(400).json({ message: "All fields are required"})
        }

        if (fullName.length < 3 || fullName.length > 20) {
            return res.status(400).json({ message: "Full name must be between 3 and 50 characters" });
        }

        if (!validator.isEmail(email)) {
            return res.status(400).json({ message: "Invalid email format" });
        }

        if (!validator.isStrongPassword(password, {
            minLength: 8,
            minLowercase: 1,
            minUppercase: 1,
            minNumbers: 1,
            minSymbols: 1,
        })) {
            return res.status(400).json({
                message: "Password must be at least 8 chars, include uppercase, lowercase, number, and symbol"
            });
        }

        const user = await User.findOne({email})

        if (user) return res.status(400).json({message: "Email already exists"})

        const passSalt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, passSalt)

        const otpPlain = Math.floor(100000 + Math.random() * 900000).toString();
        const otpSalt = await bcrypt.genSalt(10);
        const otpHash = await bcrypt.hash(otpPlain, otpSalt);

        const expiresAt = new Date(Date.now() + 1 * 60 * 1000); // 1 minute
        await OTP.findOneAndDelete({ email }); // remove any old OTPs
        await OTP.create({ email, otpHash, expiresAt, fullName, passwordHash: hashedPassword });

        sendOtpEmail(email, otpPlain).catch(err => console.error('OTP email send error:', err?.message || err));

        // inform frontend to show verify page
        return res.status(201).json({
            message: 'Verification code sent',
            email
        });
    }
    catch (error) {
        console.log("Error in signup controller", error.message)
        res.status(500).json({ message: "Internal Server Error"})
    }
};

export const login = async (req, res) => {
    const {email, password} = req.body
    try {
        const user = await User.findOne({email})

        if(!user) {
            return res.status(400).json({message:"Invalid credentials"})
        }

        const isPasswordCorrect= await bcrypt.compare(password, user.password)
        if(!isPasswordCorrect) {
            return res.status(400).json({message:"Invalid credentials"})
        }

        generateToken(user._id, res)

        res.status(200).json({
            _id:user._id,
            fullName: user.fullName,
            email: user.email,
            profilePic: user.profilePic,
        })
    }
    catch (error) {
        console.log("Error in login controller", error.message)
        res.status(500).json({message: "Internal Server Error"})
    }
};

// Verify OTP endpoint
export const verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) return res.status(400).json({ message: 'Email and OTP are required' });

        const otpDoc = await OTP.findOne({ email });
        if (!otpDoc) return res.status(400).json({ message: 'OTP not found or expired' });

        if (otpDoc.attempts >= otpDoc.maxAttempts) {
            await OTP.findOneAndDelete({ email });
            return res.status(429).json({ message: 'Too many attempts. Please request a new code.' });
        }

        const isMatch = await bcrypt.compare(otp, otpDoc.otpHash);
        if (!isMatch) {
            otpDoc.attempts += 1;
            await otpDoc.save();
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        // OTP valid - create the user using stored pending data (if user doesn't already exist)
        let user = await User.findOne({ email });
        if (!user) {
            const userData = {
                fullName: otpDoc.fullName || "User",
                email,
                password: otpDoc.passwordHash, // already hashed
                verified: true
            };
            user = new User(userData);
            await user.save();
        } else {
            // if a user exists (edge cases), ensure it's marked verified
            user = await User.findOneAndUpdate({ email }, { $set: { verified: true } }, { new: true });
        }

        await OTP.findOneAndDelete({ email });

        // create token and login
        generateToken(user._id, res);
        return res.status(200).json({ message: 'Verified', _id: user._id, email: user.email });
        
    } catch (error) {
        console.error('Error in verifyOtp:', error.message);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// Resend OTP endpoint
export const resendOtp = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ message: 'Email required' });

        // Allow resending for pending verification (OTP doc) or existing user
        const user = await User.findOne({ email });
        const pending = await OTP.findOne({ email });

        if (!user && !pending) return res.status(404).json({ message: 'No pending verification or user found' });

        // limit resend attempts via attempts field on OTP doc
        if (pending && pending.attempts >= pending.maxAttempts) {
            return res.status(429).json({ message: 'Resend limit reached' });
        }

        const otpPlain = Math.floor(100000 + Math.random() * 900000).toString();
        const salt = await bcrypt.genSalt(10);
        const otpHash = await bcrypt.hash(otpPlain, salt);
        const expiresAt = new Date(Date.now() + 1 * 60 * 1000); // 1 minute

        // preserve pending signup data if present
        const fullName = pending?.fullName;
        const passwordHash = pending?.passwordHash;

        await OTP.findOneAndDelete({ email });
        await OTP.create({ email, otpHash, attempts: 0, maxAttempts: 3, expiresAt, fullName, passwordHash });

        sendOtpEmail(email, otpPlain).catch(err => console.error('OTP email send error:', err?.message || err));

        return res.status(200).json({ message: 'OTP resent' });
    } catch (error) {
        console.error('Error in resendOtp:', error.message);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
export const logout = (req, res) => {
    try {
        res.cookie("jwt", "", { maxAge: 0 });
        res.status(200).json({ message: "Logged out successfully" });
    } 
    catch (error) {
        console.log("Error in logout controller", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
}

export const updateProfile = async (req, res) => {
    try {
        const {profilePic}= req.body
        const userId = req.user._id

        if(!profilePic) {
            return res.status(400).json({ message: "Profile pic is required"})
        }
        const uploadResponse = await cloudinary.uploader.upload(profilePic, {
        folder: "user_profiles"
        });
        const updatedUser = await User.findByIdAndUpdate(userId, {profilePic: uploadResponse.secure_url}, {new: true})

        res.status(200).json(updatedUser)
    }
    catch (error) {
        console.log("Error in update profile:", error)
        res.status(500).json({ message: "Internal server error"})
    }
}

export const checkAuth = (req, res) => {
    try {
        res.status(200).json(req.user)
    }
    catch (error) {
        console.log("Error in checkAuth controller", error.message)
        res.status(500).json({message: "Internal Server Error"})
    } 
}