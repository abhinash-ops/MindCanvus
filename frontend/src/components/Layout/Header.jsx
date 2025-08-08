import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { Search, Menu, X, User, LogOut, Plus, Home, Users, FileText } from 'lucide-react'

const Header = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery('')
    }
  }

  const handleLogout = () => {
    logout()
    setIsMenuOpen(false)
  }

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-primary-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">M</span>
            </div>
            <span className="text-xl font-bold text-gradient">MindCanvus</span>
          </Link>

          {/* Search Bar */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <form onSubmit={handleSearch} className="w-full">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search posts, users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </form>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link to="/" className="flex items-center space-x-1 px-3 py-2 rounded-lg text-gray-600 hover:text-gray-900">
              <Home className="w-4 h-4" />
              <span>Home</span>
            </Link>
            
            <Link to="/posts" className="flex items-center space-x-1 px-3 py-2 rounded-lg text-gray-600 hover:text-gray-900">
              <FileText className="w-4 h-4" />
              <span>Posts</span>
            </Link>

            {user && (
              <>
                <Link to="/create-post" className="flex items-center space-x-1 px-3 py-2 rounded-lg text-gray-600 hover:text-gray-900">
                  <Plus className="w-4 h-4" />
                  <span>Write</span>
                </Link>
                <Link to="/friends" className="flex items-center space-x-1 px-3 py-2 rounded-lg text-gray-600 hover:text-gray-900">
                  <Users className="w-4 h-4" />
                  <span>Friends</span>
                </Link>
              </>
            )}
          </nav>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100"
                >
                  <img
                    src={user.avatar || `https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}&background=6366f1&color=fff`}
                    alt={user.username}
                    className="w-8 h-8 rounded-full"
                  />
                  <span className="hidden sm:block text-sm font-medium text-gray-700">
                    {user.firstName}
                  </span>
                </button>

                {isMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    <Link to="/dashboard" className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setIsMenuOpen(false)}>
                      <Home className="w-4 h-4" />
                      <span>Dashboard</span>
                    </Link>
                    <Link to="/profile" className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setIsMenuOpen(false)}>
                      <User className="w-4 h-4" />
                      <span>Profile</span>
                    </Link>
                    <hr className="my-1" />
                    <button onClick={handleLogout} className="flex items-center space-x-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left">
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link to="/login" className="px-4 py-2 text-gray-700 hover:text-gray-900">
                  Login
                </Link>
                <Link to="/register" className="btn btn-primary">
                  Sign Up
                </Link>
              </div>
            )}

            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden p-2 rounded-lg hover:bg-gray-100">
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <div className="space-y-2">
              <Link to="/" className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg" onClick={() => setIsMenuOpen(false)}>
                Home
              </Link>
              <Link to="/posts" className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg" onClick={() => setIsMenuOpen(false)}>
                Posts
              </Link>
              {user ? (
                <>
                  <Link to="/dashboard" className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg" onClick={() => setIsMenuOpen(false)}>
                    Dashboard
                  </Link>
                  <Link to="/create-post" className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg" onClick={() => setIsMenuOpen(false)}>
                    Write Post
                  </Link>
                  <Link to="/friends" className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg" onClick={() => setIsMenuOpen(false)}>
                    Friends
                  </Link>
                  <Link to="/profile" className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg" onClick={() => setIsMenuOpen(false)}>
                    Profile
                  </Link>
                  <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg">
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg" onClick={() => setIsMenuOpen(false)}>
                    Login
                  </Link>
                  <Link to="/register" className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg" onClick={() => setIsMenuOpen(false)}>
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}

export default Header
