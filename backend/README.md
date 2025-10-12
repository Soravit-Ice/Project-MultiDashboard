# Multi Dashboard Backend

## Setup Instructions

### 1. ติดตั้ง Dependencies
```bash
cd project-multidashboard/backend
npm install
```

### 2. ตั้งค่า PostgreSQL Database
ตรวจสอบว่าคุณมี PostgreSQL ติดตั้งและรันอยู่แล้ว

แก้ไข `.env` file:
```env
DATABASE_URL="postgresql://YOUR_USERNAME:YOUR_PASSWORD@localhost:5432/multidashboard?schema=public"
```

### 3. รัน Prisma Migrations
```bash
npm run prisma:generate
npm run prisma:migrate
```

### 4. เริ่มต้น Server
```bash
npm run dev
```

Server จะรันที่ http://localhost:5000

## API Endpoints

### Authentication
- `POST /api/auth/register` - สมัครสมาชิก
- `POST /api/auth/login` - เข้าสู่ระบบ
- `POST /api/auth/logout` - ออกจากระบบ
- `GET /api/auth/me` - ดึงข้อมูล user ปัจจุบัน (ต้อง authenticate)

## Security Features
- Password hashing ด้วย bcrypt (12 rounds)
- JWT tokens พร้อม expiration
- Session management ในฐานข้อมูล
- HTTP-only cookies
- CORS configuration
- Token validation middleware
