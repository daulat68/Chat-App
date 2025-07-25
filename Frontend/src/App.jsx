import Navbar from "./components/Navbar"
import Homepage from "./pages/HomePage"
import ProfilePage from "./pages/ProfilePage"
import LoginPage from "./pages/LoginPage"
import SettingsPage from "./pages/SettingsPage"
import SignUpPage from "./pages/SignUpPage"
import { useAuthStore } from "../store/useAuthStore"
import { Routes, Route, Navigate} from "react-router-dom"
import { useEffect } from "react"
import {Loader} from "lucide-react"
import { Toaster } from "react-hot-toast";
import {useThemeStore} from "./store/useThemeStore"

const App = () => {
  const {authUser, checkAuth, isCheckingAuth}= useAuthStore()
  const {theme}= useThemeStore()
  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  console.log({authUser})
  if (isCheckingAuth && !authUser) return(
    <div className="flex items-center justify-center h-screen">
      <Loader className="size-10 animate-spin"/>
    </div>
  )
  return (
    <div data-theme={theme}>
      <Navbar />
      <Routes>
        <Route path="/" element={authUser ? <Homepage/>: <Navigate to="/login"/>} />
        <Route path="/signup" element={<SignUpPage/>} />
        <Route path="/login" element={<LoginPage/>} />
        <Route path="/settings" element={<SettingsPage/>} />
        <Route path="/profile" element={authUser ? <ProfilePage/> : <ProfilePage/>} />
      </Routes>

      <Toaster />
    </div>
  )
}

export default App
