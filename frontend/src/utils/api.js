import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json',
  },
})

console.log('API configured with baseURL:', 'http://localhost:5000')

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.message)
    console.error('Request URL:', error.config?.url)
    console.error('Request Method:', error.config?.method)
    console.error('Response Status:', error.response?.status)
    console.error('Response Data:', error.response?.data)
    
    if (error.response?.status === 401) {
      console.log('Received 401 Unauthorized error')
      // Only redirect to login if not already on login page to prevent redirect loops
      const currentPath = window.location.pathname
      console.log('Current path:', currentPath)
      
      if (currentPath !== '/login') {
        console.log('Not on login page, redirecting...')
        // Store the current path to redirect back after login
        localStorage.setItem('redirectAfterLogin', currentPath)
        // Clear token
        localStorage.removeItem('token')
        delete api.defaults.headers.common['Authorization']
        // Redirect to login
        console.log('Redirecting to login page')
        window.location.href = '/login'
      } else {
        console.log('Already on login page, not redirecting')
      }
    }
    return Promise.reject(error)
  }
)

export default api
