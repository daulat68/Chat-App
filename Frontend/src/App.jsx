import Navbar from "./components/Navbar"
import Homepage from "./pages/HomePage"
import ProfilePage from "./pages/ProfilePage"
import LoginPage from "./pages/LoginPage"
import SettingsPage from "./pages/SettingsPage"
import SignUpPage from "./pages/SignUpPage"

import { Routes, Route } from "react-router-dom"

const App = () => {
  return (
    <div>
      <Navbar />
      <Routes>
        <Route path="/" element={<Homepage/>} />
        <Route path="/signup" element={<SignUpPage/>} />
        <Route path="/login" element={<LoginPage/>} />
        <Route path="/settings" element={<SettingsPage/>} />
        <Route path="/profile" element={<ProfilePage/>} />
      </Routes>
    </div>
  )
}

export default App
