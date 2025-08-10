import { createContext, useContext, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '../utils/api'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  // Check if user is logged in on app load
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      checkAuthStatus()
      
      // Set up interval to refresh token validation every hour
      const intervalId = setInterval(() => {
        checkAuthStatus()
      }, 60 * 60 * 1000) // Check every hour
      
      return () => clearInterval(intervalId)
    } else {
      setLoading(false)
    }
  }, [])

  const checkAuthStatus = async () => {
    try {
      console.log('Checking auth status...')
      const response = await api.get('/api/auth/me')
      console.log('Auth check successful, user:', response.data.user)
      setUser(response.data.user)
      
      // Refresh token to extend session
      try {
        console.log('Attempting to refresh token...')
        const refreshResponse = await api.post('/api/auth/refresh')
        if (refreshResponse.data.token) {
          console.log('Token refresh successful')
          localStorage.setItem('token', refreshResponse.data.token)
          api.defaults.headers.common['Authorization'] = `Bearer ${refreshResponse.data.token}`
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError)
        // Even if refresh fails, we still have a valid token from the /me request
        console.log('Using existing token instead')
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      console.error('Error response:', error.response?.data)
      console.error('Error status:', error.response?.status)
      
      // Only clear token if it's an authentication error
      if (error.response?.status === 401) {
        console.log('Clearing invalid token')
        localStorage.removeItem('token')
        delete api.defaults.headers.common['Authorization']
        setUser(null)
      }
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password) => {
    try {
      console.log('Attempting login...')
      const response = await api.post('/api/auth/login', { email, password })
      const { token, user } = response.data
      
      console.log('Login successful, setting token and user')
      localStorage.setItem('token', token)
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      setUser(user)
      
      toast.success('Login successful!')
      
      // Check if there's a redirect path stored
      const redirectPath = localStorage.getItem('redirectAfterLogin')
      if (redirectPath) {
        console.log('Redirecting to:', redirectPath)
        // Clear the stored path
        localStorage.removeItem('redirectAfterLogin')
        // Navigate to the stored path
        navigate(redirectPath)
        return { success: true, redirected: true }
      }
      
      console.log('Redirecting to dashboard')
      navigate('/dashboard')
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed'
      toast.error(message)
      return { success: false, message }
    }
  }

  const register = async (userData) => {
    try {
      console.log('Attempting registration...')
      const response = await api.post('/api/auth/register', userData)
      const { token, user } = response.data
      
      console.log('Registration successful, setting token and user')
      localStorage.setItem('token', token)
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      setUser(user)
      
      toast.success('Registration successful!')
      navigate('/dashboard')
      return { success: true }
    } catch (error) {
      console.error('Registration error:', error)
      const message = error.response?.data?.message || 'Registration failed'
      toast.error(message)
      return { success: false, message }
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    delete api.defaults.headers.common['Authorization']
    setUser(null)
    toast.success('Logged out successfully')
    navigate('/')
  }

  const updateProfile = async (profileData) => {
    try {
      console.log('Updating profile...')
      const response = await api.put('/api/auth/profile', profileData)
      setUser(response.data.user)
      toast.success('Profile updated successfully')
      return { success: true }
    } catch (error) {
      console.error('Profile update error:', error)
      const message = error.response?.data?.message || 'Profile update failed'
      toast.error(message)
      return { success: false, message }
    }
  }

  const changePassword = async (currentPassword, newPassword) => {
    try {
      console.log('Changing password...')
      await api.put('/api/auth/password', { currentPassword, newPassword })
      toast.success('Password changed successfully')
      return { success: true }
    } catch (error) {
      console.error('Password change error:', error)
      const message = error.response?.data?.message || 'Password change failed'
      toast.error(message)
      return { success: false, message }
    }
  }

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    checkAuthStatus
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
