# 🤖 ALOXADGPT — AI Developer Assistant

A full-stack AI-powered developer assistant built with React, Node.js, and MySQL.

![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?logo=mysql&logoColor=white)
![Railway](https://img.shields.io/badge/Deploy-Railway-0B0D0E?logo=railway)
![Vercel](https://img.shields.io/badge/Deploy-Vercel-000000?logo=vercel)

---

## ✨ Features

- 💬 Chat with AI (OpenAI / Gemini)
- 🧑‍💻 Generate & explain code
- 🐛 Debug and fix errors
- 💡 Generate project ideas
- 📜 Save & browse chat history
- 🔐 User authentication (JWT)
- 🌙 Dark / Light theme

---

## 🛠️ Tech Stack

| Layer          | Technology                  |
|----------------|-----------------------------|
| Frontend       | React.js + Vite 5           |
| UI             | Bootstrap 5 + Bootstrap Icons |
| Backend        | Node.js + Express.js        |
| Database       | MySQL (via XAMPP)           |
| AI             | OpenAI API / Gemini API     |
| Auth           | JWT (jsonwebtoken)          |
| Password       | bcryptjs                    |
| HTTP Client    | Axios                       |
| Routing        | React Router DOM            |

---

## 📁 Project Structure

```
ALOXADGPT/
├── client/                  # React Frontend (Vite)
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Page-level components
│   │   ├── services/        # Axios API calls
│   │   ├── context/         # React Context (auth, theme)
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
│
├── server/                  # Node.js Backend
│   ├── config/
│   │   └── db.js            # MySQL connection
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── chatController.js
│   │   └── userController.js
│   ├── middleware/
│   │   └── authMiddleware.js # JWT verification
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── chatRoutes.js
│   │   └── userRoutes.js
│   ├── .env                 # Environment variables
│   └── server.js            # Entry point
│
├── database/
│   └── database.sql         # MySQL schema
│
├── docs/                    # Project documentation
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- XAMPP (MySQL)
- Git

### 1️⃣ Clone the repo
```bash
git clone https://github.com/yourusername/ALOXADGPT.git
cd ALOXADGPT
```

### 2️⃣ Setup Database
1. Start XAMPP → Start **Apache** + **MySQL**
2. Open `http://localhost/phpmyadmin`
3. Import `database/database.sql`

### 3️⃣ Setup Backend
```bash
cd server
npm install
```
Edit `.env` and add your API keys:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=aloxadgpt
JWT_SECRET=your_secret_key
OPENAI_API_KEY=your_openai_key
GEMINI_API_KEY=your_gemini_key
```
Start the server:
```bash
npm start
```
Server runs at: `http://localhost:5000`

### 4️⃣ Setup Frontend
```bash
cd client
npm install
npm run dev
```
App runs at: `http://localhost:5173`

---

## 🔌 API Endpoints

### Auth
| Method | Endpoint              | Description       |
|--------|-----------------------|-------------------|
| POST   | /api/auth/register    | Register user     |
| POST   | /api/auth/login       | Login user        |

### Chat
| Method | Endpoint                        | Description            |
|--------|---------------------------------|------------------------|
| POST   | /api/chat/message               | Save message           |
| GET    | /api/chat/history/:session_id   | Get session history    |
| GET    | /api/chat/sessions              | Get all user sessions  |

### User
| Method | Endpoint           | Description        |
|--------|--------------------|--------------------|
| GET    | /api/user/profile  | Get profile        |
| PUT    | /api/user/profile  | Update profile     |

> 🔒 Chat and User routes require `Authorization: Bearer <token>` header.

---

## 🗄️ Database Tables

| Table           | Purpose                        |
|-----------------|--------------------------------|
| users           | User accounts                  |
| chat_sessions   | Chat conversation groups       |
| chat_history    | Individual messages            |
| code_snippets   | Saved code                     |
| project_ideas   | AI-generated project ideas     |

---

## 👤 Default Admin Account
```
Email:    admin@aloxadgpt.com
Password: admin123
```
> ⚠️ Change this password after first login!

---

## 📌 Upcoming Features (Step 2+)
- [ ] Complete ChatGPT-style UI
- [ ] AI integration (OpenAI / Gemini)
- [ ] Code syntax highlighting
- [ ] Dark / Light theme toggle
- [ ] Responsive mobile design

---

## 🚀 Production Deployment

See the full deployment guide: [docs/deployment-guide.md](docs/deployment-guide.md)

| Guide | Description |
|-------|-------------|
| [Deployment Guide](docs/deployment-guide.md) | End-to-end deploy to Railway + Vercel |
| [Environment Variables](docs/environment-variables.md) | All env vars reference |
| [Domain + HTTPS Setup](docs/domain-https-setup.md) | Custom domain configuration |
| [Monitoring Guide](docs/monitoring-guide.md) | UptimeRobot, Railway metrics, Sentry |

---

## 📄 License
MIT License — free to use and modify.
