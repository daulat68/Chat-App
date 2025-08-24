# ChatApp 🚀

A real-time chat application built with the **MERN stack**, **Socket.io**, **TailwindCSS**, and **DaisyUI**. It features **JWT authentication and authorization**, **real-time messaging**, **online user status**, **Redis caching for messages**, **global state management using Zustand**, and robust **validation and error handling** at both the **data** and **API level**.  

---

## 🌟 Features

- **Authentication & Authorization**
  - JWT-based signup/login
  - Secure password storage
- **Real-time Chat**
  - One-to-one messaging
  - Online/offline user tracking
  - Message caching with Redis for faster retrieval
- **Global State Management**
  - Managed using **Zustand**
- **Validation & Error Handling**
  - Data-level validation in MongoDB
  - API-level validation and error handling
- **Responsive UI**
  - TailwindCSS + DaisyUI
  - Multiple themes (Light, Dark, Cupcake, Synthwave, Cyberpunk, Dracula, etc.)
  - Gradient glow animations on login/signup pages
- **Deployment Ready**
  - Works on localhost for development
  - Supports cloud deployment (Render, Vercel, AWS)

---

## 🛠️ Tech Stack

- **Frontend:** React, TailwindCSS, DaisyUI, Zustand  
- **Backend:** Node.js, Express.js, Socket.io, Redis  
- **Database:** MongoDB (Mongoose)  
- **Email Service:** Brevo (Sendinblue) for OTP verification  
- **Authentication:** JWT + bcryptjs  

---

## ⚡ Installation

### 1. Clone the repository
```bash
git clone https://github.com/daulat68/Chat-App.git
```

You can view the live version of the app here: 
https://chat-app-jwzl.onrender.com/

###    Note:
The app may take a few seconds to load the first time as the server is starting up. Please be patient on the first visit.