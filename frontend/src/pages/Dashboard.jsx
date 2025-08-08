import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Plus, Edit, Eye, Heart, MessageCircle, Calendar, Users } from 'lucide-react'
import { format } from 'date-fns'
import api from '../utils/api'

const Dashboard = () => {
  const { user } = useAuth()
  const [posts, setPosts] = useState([])
  const [stats, setStats] = useState({
    totalPosts: 0,
    totalViews: 0,
    totalLikes: 0,
    totalComments: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const [postsResponse, statsResponse] = await Promise.all([
        api.get('/posts/user/' + user._id + '?limit=5'),
        api.get('/posts/user/' + user._id + '?status=published')
      ])

      setPosts(postsResponse.data.posts)
      
      // Calculate stats
      const allPosts = statsResponse.data.posts
      const totalViews = allPosts.reduce((sum, post) => sum + post.views, 0)
      const totalLikes = allPosts.reduce((sum, post) => sum + post.likesCount, 0)
      const totalComments = allPosts.reduce((sum, post) => sum + (post.commentsCount || 0), 0)

      setStats({
        totalPosts: allPosts.length,
        totalViews,
        totalLikes,
        totalComments
      })
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome back, {user.firstName}!</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-3 bg-primary-100 rounded-lg">
              <Edit className="w-6 h-6 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Posts</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalPosts}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <Eye className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Views</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalViews}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-3 bg-red-100 rounded-lg">
              <Heart className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Likes</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalLikes}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <MessageCircle className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Comments</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalComments}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-4">
          <Link
            to="/create-post"
            className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Write New Post</span>
          </Link>
          <Link
            to="/friends"
            className="flex items-center space-x-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            <Users className="w-4 h-4" />
            <span>Manage Friends</span>
          </Link>
          <Link
            to="/profile"
            className="flex items-center space-x-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            <Calendar className="w-4 h-4" />
            <span>Edit Profile</span>
          </Link>
        </div>
      </div>

      {/* Recent Posts */}
      <div className="card p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Recent Posts</h2>
          <Link
            to="/posts"
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            View All
          </Link>
        </div>

        {posts.length === 0 ? (
          <div className="text-center py-8">
            <Edit className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No posts yet</h3>
            <p className="text-gray-600 mb-4">Start writing your first post to share your thoughts with the world.</p>
            <Link
              to="/create-post"
              className="btn btn-primary"
            >
              Write Your First Post
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <div key={post._id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      <Link to={`/posts/${post._id}`} className="hover:text-primary-600">
                        {post.title}
                      </Link>
                    </h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-500 mb-2">
                      <span className="px-2 py-1 bg-primary-100 text-primary-800 rounded-full text-xs">
                        {post.category}
                      </span>
                      <span>{format(new Date(post.createdAt), 'MMM dd, yyyy')}</span>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        post.status === 'published' 
                          ? 'bg-green-100 text-green-800' 
                          : post.status === 'draft'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {post.status}
                      </span>
                    </div>
                    {post.excerpt && (
                      <p className="text-gray-600 text-sm line-clamp-2">{post.excerpt}</p>
                    )}
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Eye className="w-4 h-4" />
                      <span>{post.views}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Heart className="w-4 h-4" />
                      <span>{post.likesCount}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <MessageCircle className="w-4 h-4" />
                      <span>{post.commentsCount || 0}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex space-x-2">
                  <Link
                    to={`/posts/${post._id}`}
                    className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                  >
                    View
                  </Link>
                  <Link
                    to={`/edit-post/${post._id}`}
                    className="text-gray-600 hover:text-gray-700 text-sm font-medium"
                  >
                    Edit
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard
