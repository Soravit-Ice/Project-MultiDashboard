# Multi Dashboard

A modern, beautiful dashboard application with Discord integration.

## 🚀 Quick Start

### Backend Setup

```bash
cd backend
npm install
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

Backend will run on http://localhost:5000

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend will run on http://localhost:5173

## 📦 Features

- ✅ Beautiful Login & Register pages
- ✅ Secure authentication with JWT
- ✅ Session management
- ✅ Protected routes
- ✅ Discord configuration dashboard
- ✅ Modern UI with Tailwind CSS
- ✅ Responsive design

## 🛠️ Tech Stack

### Frontend
- React 19
- Tailwind CSS 3
- Ant Design 5
- React Router DOM
- Zustand (State Management)
- Axios

### Backend
- Node.js
- Express
- PostgreSQL
- Prisma ORM
- JWT Authentication
- bcryptjs

## 🔐 Environment Variables

### Backend (.env)
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/multidashboard?schema=public"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
SESSION_SECRET="your-super-secret-session-key-change-this-in-production"
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000/api
```

## 📝 Database Setup

1. Make sure PostgreSQL is installed and running
2. Update DATABASE_URL in backend/.env
3. Run migrations:
```bash
cd backend
npm run prisma:migrate
```

## 🎨 Design Features

- Gradient backgrounds
- Glassmorphism effects
- Smooth animations
- Social login buttons
- Modern card designs
- Responsive layout

## 📱 Pages

- `/login` - Login page
- `/register` - Registration page
- `/dashboard` - Main dashboard (protected)

## 🔒 Security

- Password hashing with bcrypt (12 rounds)
- JWT tokens with expiration
- Session validation
- HTTP-only cookies
- CORS protection
- Protected routes

## 👨‍💻 Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## 📄 License

MIT License - feel free to use this project!

---

Made with ❤️ by Multi Dashboard Team
