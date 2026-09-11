# Taskly – React Native To-Do App

Taskly is a modern Android To-Do application built with React Native CLI and TypeScript. It provides user authentication, task management, deadlines, priorities, filtering, and smart task sorting.

The application uses a Node.js/Express backend with MongoDB for persistent task storage and JWT-based authentication.

---

##  Download APK

Try the latest Android release of Taskly:

👉 [Download Taskly APK](https://drive.google.com/file/d/1uwCoXqIQTTADu5GwzgtsQIXCFzbCsB1D/view?usp=sharing)

> The APK is hosted on Google Drive. Enable "Download anyway" if Google Drive displays a warning because the file is an Android executable.

---

## 🎥 Demo

Watch the Taskly application demo:

👉 [Watch Taskly Demo](https://drive.google.com/file/d/1UefBQ2uWMbb3m4vk9F44J_8Ao8Qv2ZyA/view?usp=sharing)

> The demo covers authentication, task creation, deadlines, priorities, task completion, editing, deletion, filtering, and smart sorting.

---

##  Features

### Authentication
- User registration with email and password
- User login and logout
- JWT-based authentication
- Persistent authentication using AsyncStorage
- Protected task APIs

### Task Management
- Create tasks
- Edit tasks
- Delete tasks
- Mark tasks as completed
- View task completion status
- Task title and description
- Scheduled date and time
- Deadline
- Priority levels:
  - Low
  - Medium
  - High

### Organization & Bonus Features
- Filter tasks by:
  - All
  - Pending
  - Completed
- Sort tasks by:
  - Smart
  - Deadline
  - Priority
  - Newest
- Smart sorting based on:
  - Task completion status
  - Deadline
  - Priority
- Task counts
- Pull-to-refresh
- Empty and error states
- Taskly branded UI

---

## 🛠️ Technology Stack

### Mobile Application

- React Native CLI
- TypeScript
- React Navigation
- React Context API
- Axios
- AsyncStorage
- React Native Safe Area Context
- React Native Screens

### Backend

- Node.js
- Express.js
- TypeScript
- MongoDB
- Mongoose
- JWT
- bcryptjs
- CORS
- dotenv

### Deployment

- Backend deployed using Render
- MongoDB hosted using MongoDB Atlas

---

## 📂 Project Structure

```text
TodoApp/
│
├── android/
│
├── src/
│   ├── components/
│   │
│   ├── screens/
│   │   ├── LoginScreen.tsx
│   │   ├── RegisterScreen.tsx
│   │   ├── HomeScreen.tsx
│   │   ├── AddTaskScreen.tsx
│   │   └── EditTaskScreen.tsx
│   │
│   ├── navigation/
│   │   └── AppNavigator.tsx
│   │
│   ├── services/
│   │   └── api.ts
│   │
│   ├── context/
│   │   └── AuthContext.tsx
│   │
│   ├── types/
│   │   ├── index.ts
│   │   └── navigation.ts
│   │
│   └── utils/
│
├── server/
│   └── src/
│       ├── models/
│       │   ├── User.ts
│       │   └── Task.ts
│       │
│       ├── controllers/
│       │   ├── authController.ts
│       │   └── taskController.ts
│       │
│       ├── routes/
│       │   ├── authRoutes.ts
│       │   └── taskRoutes.ts
│       │
│       ├── middleware/
│       │   └── authMiddleware.ts
│       │
│       ├── config/
│       │   └── database.ts
│       │
│       └── server.ts
│
├── App.tsx
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🔐 Authentication Flow

Taskly uses JWT-based authentication.

### Registration

The user provides:

- Email
- Password
- Password confirmation

The backend:

1. Validates the request.
2. Checks whether the email already exists.
3. Hashes the password using bcrypt.
4. Creates the user.
5. Returns an authentication token.

### Login

The backend:

1. Finds the user by email.
2. Compares the password using bcrypt.
3. Generates a JWT.
4. Returns the authenticated user and token.

The mobile application stores the authentication information using AsyncStorage and restores the session when the application starts.

---

## 🔑 API

### Authentication

```text
POST /api/auth/register
POST /api/auth/login
```

### Tasks

All task endpoints require a valid JWT Bearer token.

```text
GET    /api/tasks
POST   /api/tasks
PUT    /api/tasks/:id
DELETE /api/tasks/:id
```

Example authentication header:

```text
Authorization: Bearer <JWT_TOKEN>
```

Each task is associated with the authenticated user so users only access their own tasks.

---

## 🗃️ Task Data Model

A task contains:

```text
title
description
dateTime
deadline
priority
completed
userId
createdAt
```

Priority values:

```text
low
medium
high
```

---

## Smart Sorting

Taskly includes a smart sorting algorithm that considers multiple task attributes instead of relying on a single field.

The sorting logic considers:

1. Completed vs pending status
2. Deadline proximity
3. Priority
4. Tasks with deadlines within the next 24 hours receive stronger priority consideration

This helps surface tasks that require attention sooner.

---

## ⚙️ Environment Variables

### Backend

Create:

```text
server/.env
```

Example:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

Do not commit `.env` files or credentials to Git.

---

## 🚀 Running the Project Locally

### Prerequisites

Install:

- Node.js
- npm
- Java 17
- Android Studio
- Android SDK
- Android device or emulator

React Native CLI is used for the Android application.

---

### 1. Clone the repository

```bash
git clone https://github.com/Khanvilkar20/TodoApplication.git
cd TodoApplication
```

---

### 2. Install mobile dependencies

```bash
npm install
```

---

### 3. Configure the backend

```bash
cd server
npm install
```

Create:

```text
server/.env
```

Add your MongoDB connection string and JWT secret.

---

### 4. Start the backend

```bash
npm run dev
```

The local backend runs on:

```text
http://localhost:5000
```

---

### 5. Start Metro

From the project root:

```bash
cd ..
npx react-native start
```

---

### 6. Run the Android application

With an Android device connected through USB debugging or an Android emulator running:

```bash
npx react-native run-android
```

---

## 📦 Production APK

A standalone Android release APK is included in the project build output.

The release build contains the React Native JavaScript bundle and does not require Metro to run.

The production mobile application is configured to communicate with the deployed backend.

---

## 🌐 Backend Deployment

The backend is deployed using Render.

MongoDB is hosted using MongoDB Atlas.

The mobile application communicates with the production API rather than relying on the developer's local machine.

> Note: The free Render service may sleep after periods of inactivity, so the first API request after inactivity can take longer while the service starts.

---

## 🔒 Security

- Passwords are hashed using bcrypt.
- JWT authentication is used for protected routes.
- Task endpoints require authentication.
- Tasks are associated with individual users.
- Environment variables are used for secrets.
- Sensitive credentials are excluded from Git.

---

## 🧪 Tested Functionality

The following functionality has been tested:

- User registration
- User login
- Authentication persistence
- Logout
- Create task
- View tasks
- Edit task
- Complete/uncomplete task
- Delete task
- Task priorities
- Scheduled date/time
- Deadlines
- Task filtering
- Task sorting
- Smart sorting
- Production backend integration
- Android release APK

---

## 🎨 UI & UX

Taskly focuses on a clean and simple task-management experience with:

- Taskly branding
- Clear task status indicators
- Priority indicators
- Deadline information
- Empty states
- Loading states
- Error handling
- Pull-to-refresh
- Simple task creation and editing flows

---

## 📋 Assignment Requirements

This project was developed to satisfy the following requirements:

- React Native CLI
- TypeScript
- Android application
- User registration
- User login
- Task creation
- Task description
- Date and time
- Deadline
- Priority
- Task completion
- Task deletion
- Task status
- Node.js backend
- MongoDB database
- State management
- Organized project structure

### Bonus Features Implemented

- Due dates
- Deadline-aware smart sorting
- Priority-aware sorting
- Task filtering
- Multiple sorting modes
- Polished UI
- Persistent authentication
- Production backend deployment

---

## 🔗 Project

**GitHub Repository**

https://github.com/Khanvilkar20/TodoApplication

---

## 🔮 Future Improvements

Possible future improvements include:

- Task categories and tags
- Push notifications
- Recurring tasks
- Search
- Calendar view
- Dark mode
- Offline support
- More advanced task analytics

---
