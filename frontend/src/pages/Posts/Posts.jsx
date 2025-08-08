import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Search, Filter, Eye, Heart, MessageCircle, Calendar, User } from 'lucide-react'
import { format } from 'date-fns'
import api from '../../utils/api'

const Posts = () => {
  const [posts, setPosts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchParams, setSearchParams] = useSearchParams()
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '')
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '')
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'latest')
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalPosts, setTotalPosts] = useState(0)

  useEffect(() => {
    fetchPosts()
    fetchCategories()
  }, [currentPage, searchTerm, selectedCategory, sortBy])

  const fetchPosts = async () => {
    try {
      setLoading(true)
      
      const params = new URLSearchParams({
        page: currentPage,
        limit: 12,
        sort: sortBy
      })
      
      if (searchTerm) params.append('search', searchTerm)
      if (selectedCategory) params.append('category', selectedCategory)
      
      const response = await api.get(`/posts?${params}`)
      setPosts(response.data.posts)
      setTotalPages(response.data.totalPages || 1)
      setTotalPosts(response.data.totalPosts || 0)
      
      // Update URL params
      const newParams = new URLSearchParams()
      if (searchTerm) newParams.set('search', searchTerm)
      if (selectedCategory) newParams.set('category', selectedCategory)
      if (sortBy !== 'latest') newParams.set('sort', sortBy)
      if (currentPage > 1) newParams.set('page', currentPage)
      
      setSearchParams(newParams)
    } catch (error) {
      console.error('Error fetching posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await api.get('/posts/categories')
      setCategories(response.data.categories)
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const handleSearch = (e) => {
    setCurrentPage(1)
    setSearchTerm(e.target.value)
  }

  const handleCategoryChange = (category) => {
    setCurrentPage(1)
    setSelectedCategory(category === selectedCategory ? '' : category)
  }

  const handleSortChange = (sort) => {
    setCurrentPage(1)
    setSortBy(sort)
  }

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedCategory('')
    setSortBy('latest')
    setCurrentPage(1)
  }

  const handlePageChange = (page) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (loading && posts.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Explore Posts
            </h1>
            <p className="text-xl text-gray-600">
              Discover amazing stories and insights from our community
            </p>
          </div>

          {/* Search and Filters */}
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search posts..."
                value={searchTerm}
                onChange={handleSearch}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center space-x-2">
                <Filter className="w-5 h-5 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Filters:</span>
              </div>

              {/* Category Filter */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleCategoryChange('')}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    selectedCategory === '' 
                      ? 'bg-primary-600 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  All Categories
                </button>
                {categories.map((category) => (
                  <button
                    key={category._id}
                    onClick={() => handleCategoryChange(category._id)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      selectedCategory === category._id 
                        ? 'bg-primary-600 text-white' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {category._id} ({category.count})
                  </button>
                ))}
              </div>

              {/* Sort Options */}
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-700">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="latest">Latest</option>
                  <option value="oldest">Oldest</option>
                  <option value="popular">Most Popular</option>
                  <option value="views">Most Viewed</option>
                </select>
              </div>

              {/* Clear Filters */}
              {(searchTerm || selectedCategory || sortBy !== 'latest') && (
                <button
                  onClick={clearFilters}
                  className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 underline"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Posts Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {posts.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-gray-400 mb-4">
              <Search className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No posts found
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || selectedCategory 
                ? 'Try adjusting your search or filters'
                : 'Be the first to create a post!'
              }
            </p>
            {!searchTerm && !selectedCategory && (
              <Link
                to="/create-post"
                className="btn btn-primary"
              >
                Create Your First Post
              </Link>
            )}
          </div>
        ) : (
          <>
            {/* Results Info */}
            <div className="mb-6">
              <p className="text-gray-600">
                Showing {posts.length} of {totalPosts} posts
                {searchTerm && ` for "${searchTerm}"`}
                {selectedCategory && ` in ${selectedCategory}`}
              </p>
            </div>

            {/* Posts Grid */}
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

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-12 flex justify-center">
                <nav className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-3 py-2 text-sm font-medium rounded-md ${
                        currentPage === page
                          ? 'bg-primary-600 text-white'
                          : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </nav>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default Posts
