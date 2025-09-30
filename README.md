# TravelBunk - Find Your Travel Tribe 🌍

A modern Gen Z-focused travel companion finder website built with Node.js, Express, MongoDB, and Firebase Auth.

## 🚀 Tech Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript (ES6+)
  - Fonts/Icons: Google Fonts (Poppins), Font Awesome
  - Firebase Web SDK (Compat): App/Auth via CDN `9.23.0` loaded in `public/index.html`
  - Frontend files: `public/index.html`, `public/style.css`, `public/script.js`, `public/firebase-config.js`

- **Backend**: Node.js + Express.js
  - Express `^4.18.2`
  - Static serving of `public/` and route mounting in `server.js`

- **Database**: MongoDB via Mongoose `^7.5.0`

- **Authentication**:
  - Client: Firebase Auth (email/password, Google) exposed via `window.firebaseAuth`
  - Server: Firebase Admin (initialized in `config/firebase.js`) + custom JWT with `jsonwebtoken` `^9.0.2`

- **Security & Middleware**:
  - `helmet` `^7.0.0`
  - `cors` `^2.8.5`
  - `express-rate-limit` `^6.10.0`
  - `express-mongo-sanitize` `^2.2.0`
  - `hpp` `^0.2.3`

- **File Uploads & Media (ready)**:
  - `multer` `^1.4.4`, `cloudinary` `^1.40.0`

- **Realtime (planned)**: `socket.io` `^4.7.2`

- **Utilities/Tooling**:
  - `dotenv` `^16.3.1` for env vars
  - `nodemon` `^3.0.1` for development

## 🛠️ Setup Instructions

### 1. Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or MongoDB Atlas)
- Firebase project

### 2. Installation
```bash
npm install
```

### 3. Environment Setup
Create a `.env` file with your configuration:
```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/travelbunk

# Firebase
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com

# Server
PORT=5000
JWT_SECRET=your-super-secret-jwt-key

# Cloudinary (optional)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### 4. Start the Server
```bash
npm run dev    # Development mode with nodemon
npm start      # Production mode
```

### 5. Access the Application
- **Frontend**: http://localhost:5000
- **API Health**: http://localhost:5000/api/health

## 📁 Project Structure

```
TravelBunk/
├── models/
│   └── User.js              # User schema
├── routes/
│   ├── auth.js              # Authentication routes
│   ├── users.js             # User management
│   ├── companions.js        # Companion matching
│   ├── trips.js             # Trip rooms
│   └── chat.js              # Chat system
├── index.html               # Main landing page
├── signin.html              # Sign in page
├── signup.html              # Sign up page
├── style.css                # Main styles
├── auth.css                 # Auth page styles
├── script.js                # Frontend JavaScript
├── auth.js                  # Auth JavaScript
├── server.js                # Express server
└── package.json             # Dependencies
```

## 🔥 Features

### ✅ Completed
- Modern responsive design
- User authentication pages
- Landing page with all sections
- Backend API structure
- MongoDB integration
- User management system
- Companion matching algorithm
- Trip room system
- Basic chat functionality

### 🚧 Next Steps
1. Set up Firebase project
2. Connect frontend forms to backend APIs
3. Implement real-time chat with Socket.IO
4. Add image upload functionality
5. Deploy to production

## 🎯 API Endpoints

### Authentication
- `POST /api/auth/firebase-auth` - Login/Register with Firebase
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update profile

### Users
- `GET /api/users` - Get all users
- `GET /api/users/search` - Search users
- `GET /api/users/:id` - Get user by ID

### Companions
- `GET /api/companions/find` - Find compatible companions
- `GET /api/companions/featured` - Get featured companions
- `POST /api/companions/request` - Send companion request

### Trips
- `GET /api/trips` - Get all trip rooms
- `GET /api/trips/featured` - Get featured trips
- `POST /api/trips` - Create trip room
- `POST /api/trips/:id/join` - Join trip
- `POST /api/trips/:id/leave` - Leave trip

### Chat
- `GET /api/chat/:tripRoomId` - Get messages
- `POST /api/chat/:tripRoomId/send` - Send message

## 🔧 Development

### Running in Development Mode
```bash
npm run dev
```

### Testing API Endpoints
Use tools like Postman or curl to test the API endpoints.

## 🚀 Deployment

Ready for deployment to platforms like:
- **Netlify/Vercel** (Frontend)
- **Railway/Render** (Backend)
- **MongoDB Atlas** (Database)

## 📱 Mobile App Coming Soon!

The TravelBunk mobile app is in development for iOS and Android.

---

**Happy Traveling! 🎒✈️**
