# MindCanvus - Blog & Social Platform

A full-featured blog and social publishing platform inspired by WordPress, designed to offer users a clean, engaging, and interactive blogging experience with built-in social networking capabilities.

## 🚀 Features

### Core Features
- **User Authentication**: Registration, login, and session management
- **Blog Functionality**: Create, edit, update, and delete blog posts
- **Post Categories**: Entertainment, Education, Fun, Movies, Technology, Lifestyle, Travel, Food, Sports, and more
- **Post Scheduling**: Schedule posts to publish at future times
- **Social Features**: Add/remove friends, like and comment on posts
- **Friends Feed**: View friends' posts in a feed-style format
- **Modern UI**: Clean, responsive design with dark/light mode support

### Technical Features
- **MERN Stack**: MongoDB, Express.js, React, Node.js
- **Real-time Updates**: Live notifications and updates
- **Responsive Design**: Mobile-first approach
- **Security**: JWT authentication, input validation, rate limiting
- **Performance**: Optimized queries, caching, and lazy loading

## 🛠️ Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **express-validator** - Input validation
- **cors** - Cross-origin resource sharing
- **helmet** - Security headers
- **morgan** - HTTP request logger

### Frontend
- **React 18** - UI library
- **Vite** - Build tool
- **React Router** - Client-side routing
- **Tailwind CSS** - Styling
- **React Hook Form** - Form handling
- **Axios** - HTTP client
- **React Hot Toast** - Notifications
- **Lucide React** - Icons
- **date-fns** - Date utilities

## 📦 Installation

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd mindcanvus
   ```

2. **Install dependencies**
   ```bash
   # Install root dependencies
   npm install
   
   # Install backend dependencies
   cd backend
   npm install
   
   # Install frontend dependencies
   cd ../frontend
   npm install
   ```

3. **Environment Setup**
   ```bash
   # Copy environment file
   cd ../backend
   cp config.env.example config.env
   
   # Edit the environment variables
   nano config.env
   ```

   Update the following variables in `backend/config.env`:
   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/mindcanvus
   JWT_SECRET=your own key
   JWT_EXPIRE=30d
   ```

4. **Start MongoDB**
   ```bash
   # Start MongoDB service
   mongod
   ```

5. **Run the application**
   ```bash
   # From the root directory
   npm run dev
   ```

   This will start both the backend (port 5000) and frontend (port 5173) servers.

## 🏃‍♂️ Running the Application

### Development Mode
```bash
# Run both frontend and backend
npm run dev

# Run only backend
npm run server

# Run only frontend
npm run client
```

### Production Mode
```bash
# Build frontend
npm run build

# Start production server
npm start
```

## 📁 Project Structure

```
mindcanvus/
├── backend/                 # Backend API
│   ├── models/             # Database models
│   ├── routes/             # API routes
│   ├── middleware/         # Custom middleware
│   ├── config.env         # Environment variables
│   └── server.js          # Main server file
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── contexts/      # React contexts
│   │   ├── utils/         # Utility functions
│   │   └── App.jsx        # Main app component
│   ├── public/            # Static assets
│   └── index.html         # HTML template
├── package.json           # Root package.json
└── README.md             # Project documentation
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile
- `PUT /api/auth/password` - Change password

### Posts
- `GET /api/posts` - Get all posts
- `GET /api/posts/:id` - Get single post
- `POST /api/posts` - Create post
- `PUT /api/posts/:id` - Update post
- `DELETE /api/posts/:id` - Delete post
- `POST /api/posts/:id/like` - Like/unlike post

### Comments
- `GET /api/comments/post/:postId` - Get post comments
- `POST /api/comments` - Add comment
- `PUT /api/comments/:id` - Update comment
- `DELETE /api/comments/:id` - Delete comment
- `POST /api/comments/:id/like` - Like/unlike comment

### Users
- `GET /api/users/:username` - Get user profile
- `GET /api/users/search` - Search users
- `POST /api/users/:userId/follow` - Follow user
- `DELETE /api/users/:userId/follow` - Unfollow user

### Friends
- `GET /api/friends` - Get friends list
- `GET /api/friends/requests` - Get friend requests
- `POST /api/friends/request/:userId` - Send friend request
- `PUT /api/friends/accept/:userId` - Accept friend request
- `PUT /api/friends/reject/:userId` - Reject friend request
- `DELETE /api/friends/:userId` - Remove friend

## 🎨 Features Overview

### User Authentication
- Secure registration and login
- JWT token-based authentication
- Password hashing with bcrypt
- Session management

### Blog Management
- Rich text editor for post creation
- Post categories and tags
- Draft and published post states
- Post scheduling functionality
- Featured images support

### Social Features
- Friend system with requests
- Like and comment on posts
- User profiles and avatars
- Follow/unfollow users
- Activity feed

### User Interface
- Responsive design for all devices
- Modern and clean UI
- Smooth animations and transitions
- Toast notifications
- Loading states and error handling

## 🔒 Security Features

- JWT token authentication
- Password hashing with bcrypt
- Input validation and sanitization
- Rate limiting
- CORS configuration
- Security headers with helmet
- Protected routes

## 🚀 Deployment

### Backend Deployment
1. Set up a MongoDB database (MongoDB Atlas recommended)
2. Configure environment variables
3. Deploy to platforms like Heroku, Railway, or DigitalOcean

### Frontend Deployment
1. Build the application: `npm run build`
2. Deploy to platforms like Vercel, Netlify, or GitHub Pages

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -am 'Add feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

If you encounter any issues or have questions, please:
1. Check the existing issues
2. Create a new issue with detailed information
3. Contact the development team

## 🎯 Roadmap

- [ ] Real-time notifications
- [ ] Dark mode toggle
- [ ] Advanced search filters
- [ ] Post analytics
- [ ] Private messaging
- [ ] Mobile app
- [ ] API documentation
- [ ] Unit and integration tests

---

**MindCanvus** - Where thoughts become stories, and stories connect people.
