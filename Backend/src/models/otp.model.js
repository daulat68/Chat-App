import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        index: true,
    },
    otpHash: {
        type: String,
        required: true
    },
    attempts: {
        type: Number,
        default: 0
    },
    maxAttempts: {
        type: Number,
        default: 3
    },
    expiresAt: {
        type: Date,
        required: true,
        index: { expires: 0 } 
    },
    fullName: {
        type: String
    },
    passwordHash: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const OTP = mongoose.model('OTP', otpSchema);

export default OTP;