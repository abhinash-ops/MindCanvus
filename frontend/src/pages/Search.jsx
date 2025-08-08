import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { Search as SearchIcon, User, Calendar, Eye, Heart, MessageCircle } from 'lucide-react'
import { format } from 'date-fns'
import api from '../utils/api'

const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [posts, setPosts] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('posts')

  const query = searchParams.get('q') || ''

  useEffect(() => {
    if (query) {
      performSearch()
    }
  }, [query, activeTab])

  const performSearch = async () => {
    setLoading(true)
    try {
      if (activeTab === 'posts') {
        const response = await api.get(`/posts?search=${encodeURIComponent(query)}`)
        setPosts(response.data.posts)
      } else {
        const response = await api.get(`/users/search?q=${encodeURIComponent(query)}`)
        setUsers(response.data.users)
      }
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const searchQuery = formData.get('search')
    if (searchQuery.trim()) {
      setSearchParams({ q: searchQuery.trim() })
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Search Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Search</h1>
        
        {/* Search Form */}
        <form onSubmit={handleSearch} className="max-w-2xl">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              name="search"
              defaultValue={query}
              placeholder="Search posts, users..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </form>
      </div>

      {/* Search Results */}
      {query && (
        <div>
          {/* Tabs */}
          <div className="flex space-x-8 mb-6 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('posts')}
              className={`pb-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'posts'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Posts
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`pb-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'users'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Users
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : (
            <div>
              {activeTab === 'posts' ? (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">
                    Posts ({posts.length} results)
                  </h2>
                  
                  {posts.length === 0 ? (
                    <div className="text-center py-12">
                      <SearchIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No posts found</h3>
                      <p className="text-gray-600">Try adjusting your search terms or browse our categories.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                  )}
                </div>
              ) : (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">
                    Users ({users.length} results)
                  </h2>
                  
                  {users.length === 0 ? (
                    <div className="text-center py-12">
                      <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
                      <p className="text-gray-600">Try adjusting your search terms.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {users.map((user) => (
                        <div key={user._id} className="card p-6">
                          <div className="flex items-center space-x-4">
                            <img
                              src={user.avatar || `https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}&background=6366f1&color=fff`}
                              alt={user.username}
                              className="w-16 h-16 rounded-full"
                            />
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-gray-900">
                                <Link to={`/users/${user.username}`} className="hover:text-primary-600">
                                  {user.firstName} {user.lastName}
                                </Link>
                              </h3>
                              <p className="text-gray-600 text-sm">@{user.username}</p>
                              {user.bio && (
                                <p className="text-gray-600 text-sm mt-2 line-clamp-2">
                                  {user.bio}
                                </p>
                              )}
                              <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500">
                                <span>{user.followersCount} followers</span>
                                <span>{user.followingCount} following</span>
                                <span>{user.friendsCount} friends</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!query && (
        <div className="text-center py-12">
          <SearchIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Start searching</h3>
          <p className="text-gray-600">Enter a search term above to find posts and users.</p>
        </div>
      )}
    </div>
  )
}

export default Search
