import {create} from "zustand"
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { io } from "socket.io-client";

const BASE_URL = import.meta.env.MODE === "development" ? "http://localhost:5001" : "/";

export const useAuthStore = create((set, get) => ({
    authUser: null,
    pendingEmail: null,
    isSigningUp: false,
    isLoggingIn: false,
    isUpdatingProfile: false,
    isVerifyingOtp: false,
    isResendingOtp: false,
    isCheckingAuth: true,
    onlineUsers: [],
    socket: null,

    checkAuth: async() => {
        try{
            const res = await axiosInstance.get("/auth/check")
            set({authUser:res?.data})
            get().connectSocket(); 

        }
        catch (error) {
            console.log("Error in checkAuth:", error)
            set({authUser: null})
        }
        finally{
            set({isCheckingAuth: false})
        }
    },

    signup: async (data) => {
        set({ isSigningUp: true })
        try {
            const res = await axiosInstance.post("/auth/signup", data)
            // backend now returns { message, email } and sends OTP
            if (res?.data?.email) {
                set({ pendingEmail: res.data.email });
            }
            return res.data;
        }
        catch (error) {
            toast.error(error?.response?.data?.message)
            throw error
        } finally {
            set({ isSigningUp: false })
        }
    },

    login: async(data) => {
        set({ isLoggingIn: true});
        try{
            const res = await axiosInstance.post("/auth/login", data);
            set({authUser: res.data });
            toast.success("Logged in successfully");

            get().connectSocket(); 
        }
        catch(error) {
            toast.error(error?.response?.data?.message);
        }
        finally {
            set({ isLoggingIn: false})
        }
    },

    verifyOtp: async ({ email, otp }) => {
        set({ isVerifyingOtp: true })
        try {
            const res = await axiosInstance.post('/auth/verify-otp', { email, otp })
            // On success backend sets cookie; fetch user
            await get().checkAuth();
            set({ pendingEmail: null });
            toast.success('Verified successfully')
            return res.data;
        } catch (error) {
            toast.error(error?.response?.data?.message || 'OTP verification failed')
            throw error
        } finally {
            set({ isVerifyingOtp: false })
        }
    },

    resendOtp: async (email) => {
        set({ isResendingOtp: true })
        try {
            const res = await axiosInstance.post('/auth/resend-otp', { email })
            toast.success('OTP resent')
            return res.data
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Resend failed')
            throw error
        } finally {
            set({ isResendingOtp: false })
        }
    },

    logout: async () => {
        try{
            await axiosInstance.post("/auth/logout")
            set({ authUser: null})
            toast.success("Logged out successfully")
        } catch (error) {
            toast.error(error?.response?.data?.message)
            get().disconnectSocket();
        } finally {
            set({ isSigningUp: false})
        }
    },

    updateProfile: async (data) => {
    set({ isUpdatingProfile: true });
    try {
        const res = await axiosInstance.put("/auth/update-profile", data);
        set({ authUser: res.data });
        toast.success("Profile updated successfully");
    } catch (error) {
        console.log("error in update profile:", error);
        toast.error(error?.response?.data?.message);
    } finally {
        set({ isUpdatingProfile: false });
    }
    },

    connectSocket: () => {
        const { authUser } = get();
        if (!authUser || get().socket?.connected) return;

        const socket = io(BASE_URL, {
        query: {
            userId: authUser._id,
        },
        });
        socket.connect();

        set({ socket: socket });

        socket.on("getOnlineUsers", (userIds) => {
        set({ onlineUsers: userIds });
        });
    },
    disconnectSocket: () => {
        if (get().socket?.connected) get().socket.disconnect();
    },

}))