import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, User, Eye, Heart, MessageCircle, ArrowRight } from 'lucide-react'
import { format } from 'date-fns'
import { useAuth } from '../contexts/AuthContext'
import api from '../utils/api'

const Home = () => {
  const { user } = useAuth()
  const [posts, setPosts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPosts()
    fetchCategories()
  }, [])

  const fetchPosts = async () => {
    try {
      console.log('Fetching posts...')
      const response = await api.get('/api/posts?limit=6')
      console.log('Posts response:', response.data)
      setPosts(response.data.posts)
    } catch (error) {
      console.error('Error fetching posts:', error)
      console.error('Error details:', error.response?.data || error.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      console.log('Fetching categories...')
      const response = await api.get('/api/posts/categories')
      console.log('Categories response:', response.data)
      setCategories(response.data.categories)
    } catch (error) {
      console.error('Error fetching categories:', error)
      console.error('Error details:', error.response?.data || error.message)
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
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary-600 to-purple-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Welcome to MindCanvus
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-primary-100">
              Share your thoughts, connect with friends, and discover amazing stories
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {user ? (
                <Link
                  to="/create-post"
                  className="bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                >
                  Start Writing
                </Link>
              ) : (
                <Link
                  to="/register"
                  className="bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                >
                  Get Started
                </Link>
              )}
              <Link
                to="/posts"
                className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-primary-600 transition-colors"
              >
                Explore Posts
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Posts */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Featured Posts</h2>
            <Link
              to="/posts"
              className="flex items-center space-x-2 text-primary-600 hover:text-primary-700 font-medium"
            >
              <span>View All</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post) => (
              <article key={post._id} className="card card-hover">
                {post.featuredImage && (
                  <img
                    src={post.featuredImage}
                    alt={post.title}
                    className="w-full h-48 object-cover rounded-t-lg"
                  />
                )}
                <div className="p-6">
                  <div className="flex items-center space-x-2 mb-3">
                    <span className="px-3 py-1 bg-primary-100 text-primary-800 text-xs font-medium rounded-full">
                      {post.category}
                    </span>
                    <span className="text-gray-500 text-sm">
                      {format(new Date(post.publishedAt), 'MMM dd, yyyy')}
                    </span>
                  </div>
                  
                  <h3 className="text-xl font-semibold mb-3 line-clamp-2">
                    <Link to={`/posts/${post._id}`} className="hover:text-primary-600">
                      {post.title}
                    </Link>
                  </h3>
                  
                  {post.excerpt && (
                    <p className="text-gray-600 mb-4 line-clamp-3">
                      {post.excerpt}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <img
                        src={post.author.avatar || `https://ui-avatars.com/api/?name=${post.author.firstName}+${post.author.lastName}&background=6366f1&color=fff`}
                        alt={post.author.username}
                        className="w-6 h-6 rounded-full"
                      />
                      <span className="text-sm text-gray-700">
                        {post.author.firstName} {post.author.lastName}
                      </span>
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
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Explore Categories
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {categories.map((category) => (
              <Link
                key={category._id}
                to={`/posts?category=${category._id}`}
                className="card card-hover text-center p-6"
              >
                <h3 className="font-semibold text-gray-900 mb-2">
                  {category._id}
                </h3>
                <p className="text-gray-600 text-sm">
                  {category.count} posts
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to share your story?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            {user 
              ? 'Start writing and connect with our community of readers'
              : 'Join thousands of writers and readers on MindCanvus'
            }
          </p>
          {user ? (
            <Link
              to="/create-post"
              className="btn btn-primary text-lg px-8 py-3"
            >
              Start Writing Today
            </Link>
          ) : (
            <Link
              to="/register"
              className="btn btn-primary text-lg px-8 py-3"
            >
              Join MindCanvus
            </Link>
          )}
        </div>
      </section>
    </div>
  )
}

export default Home
