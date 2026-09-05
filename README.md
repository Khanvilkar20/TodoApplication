# Taskly

A modern Android To-Do app built with React Native CLI and TypeScript, with a Node.js/Express/MongoDB backend.

## Features
- JWT authentication with bcrypt password hashing
- Create, edit, delete, complete tasks
- Deadlines, priorities (Low/Medium/High), scheduled date/time
- Filter (All/Pending/Completed) and Smart/Deadline/Priority/Newest sorting
- Pull-to-refresh, quick date/time presets
- User-specific task data in MongoDB

## Tech Stack
**Mobile:** React Native CLI, TypeScript, React Navigation, Axios, AsyncStorage
**Backend:** Node.js, Express, TypeScript, MongoDB, Mongoose, JWT, bcryptjs

## API Endpoints

GET /api/health
POST /api/auth/register
POST /api/auth/login
GET /api/tasks
POST /api/tasks
PUT /api/tasks/:id
DELETE /api/tasks/:id

Task endpoints require a JWT bearer token; users can only access their own tasks.

## Setup

```bash
git clone <your-github-repository-url>
cd TodoApp
npm install
cd server && npm install && cd ..
```

Create `server/.env`:

PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret


**Run backend:**
```bash
cd server
npm run dev
```

**Run mobile app:**
```bash
npm start
# in another terminal
npx react-native run-android
```

For a physical device:
```bash
adb reverse tcp:8081 tcp:8081
adb reverse tcp:5000 tcp:5000
```

**Build debug APK (Windows):**
```bash
cd android
.\gradlew.bat app:assembleDebug
```
Output: `android/app/build/outputs/apk/debug/app-debug.apk`

## Security
Passwords hashed with bcrypt, JWT-protected routes, per-user task access, `.env` excluded from Git.
