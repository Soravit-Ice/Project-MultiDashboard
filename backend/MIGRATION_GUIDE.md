# Migration Guide - Adding Role System

## Steps to add role system:

### 1. Run Prisma Migration
```bash
cd backend
npm run prisma:migrate
# Enter migration name: add_user_roles
```

### 2. Generate Prisma Client
```bash
npm run prisma:generate
```

### 3. Restart Backend Server
```bash
npm run dev
```

## Role System Features:

### Default Role
- All new users get `USER` role by default
- Admin role must be set manually in database

### How to Make a User Admin:

#### Option 1: Using Prisma Studio
```bash
cd backend
npm run prisma:studio
```
Then:
1. Open Users table
2. Find the user
3. Change `role` from `USER` to `ADMIN`
4. Save

#### Option 2: Using SQL
```sql
UPDATE "User" 
SET role = 'ADMIN' 
WHERE email = 'admin@example.com';
```

#### Option 3: Using Admin API (if you already have an admin)
```bash
PATCH /api/admin/users/:userId/role
Body: { "role": "ADMIN" }
Headers: Authorization: Bearer <admin-token>
```

## API Endpoints:

### Admin Only Endpoints:
- `GET /api/admin/users` - Get all users
- `PATCH /api/admin/users/:userId/role` - Update user role
- `DELETE /api/admin/users/:userId` - Delete user

### Response Format:
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "username",
    "name": "User Name",
    "role": "USER" // or "ADMIN"
  }
}
```

## Frontend Integration:

User role is available in:
- `useAuthStore().user.role`
- Can be used to show/hide admin features
- Example: `{user.role === 'ADMIN' && <AdminPanel />}`
