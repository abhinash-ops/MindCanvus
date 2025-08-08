import { Routes, Route } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import Layout from './components/Layout/Layout'
import Home from './pages/Home'
import Login from './pages/Auth/Login'
import Register from './pages/Auth/Register'
import Dashboard from './pages/Dashboard'
import Posts from './pages/Posts/Posts'
import CreatePost from './pages/Posts/CreatePost'
import EditPost from './pages/Posts/EditPost'
import PostDetail from './pages/Posts/PostDetail'
import Profile from './pages/Profile/Profile'
import UserProfile from './pages/Profile/UserProfile'
import Friends from './pages/Social/Friends'
import Search from './pages/Search'
import ProtectedRoute from './components/Auth/ProtectedRoute'

function App() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="posts" element={<Posts />} />
          <Route path="posts/:id" element={<PostDetail />} />
          <Route path="users/:username" element={<UserProfile />} />
          <Route path="search" element={<Search />} />
          
          {/* Protected Routes */}
          <Route path="dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="create-post" element={
            <ProtectedRoute>
              <CreatePost />
            </ProtectedRoute>
          } />
          <Route path="edit-post/:id" element={
            <ProtectedRoute>
              <EditPost />
            </ProtectedRoute>
          } />
          <Route path="profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
          <Route path="friends" element={
            <ProtectedRoute>
              <Friends />
            </ProtectedRoute>
          } />
        </Route>
      </Routes>
    </div>
  )
}

export default App
