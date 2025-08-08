import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { User, Users, Calendar, Eye, Heart, MessageCircle } from 'lucide-react'
import { format } from 'date-fns'
import api from '../../utils/api'

const UserProfile = () => {
  const { username } = useParams()
  const [user, setUser] = useState(null)
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUserData()
  }, [username])

  const fetchUserData = async () => {
    try {
      const [userResponse, postsResponse] = await Promise.all([
        api.get(`/users/${username}`),
        api.get(`/posts/user/${username}?status=published&limit=6`)
      ])
      
      setUser(userResponse.data.user)
      setPosts(postsResponse.data.posts)
    } catch (error) {
      console.error('Error fetching user data:', error)
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

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">User not found</h1>
          <p className="text-gray-600">The user you're looking for doesn't exist.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* User Header */}
      <div className="card p-8 mb-8">
        <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
          <img
            src={user.avatar || `https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}&background=6366f1&color=fff&size=128`}
            alt={user.username}
            className="w-32 h-32 rounded-full"
          />
          
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {user.firstName} {user.lastName}
            </h1>
            <p className="text-gray-600 text-lg mb-4">@{user.username}</p>
            
            {user.bio && (
              <p className="text-gray-700 mb-6">{user.bio}</p>
            )}
            
            <div className="flex items-center space-x-6 text-sm text-gray-500">
              <div className="flex items-center space-x-1">
                <Users className="w-4 h-4" />
                <span>{user.followersCount} followers</span>
              </div>
              <div className="flex items-center space-x-1">
                <Users className="w-4 h-4" />
                <span>{user.followingCount} following</span>
              </div>
              <div className="flex items-center space-x-1">
                <Users className="w-4 h-4" />
                <span>{user.friendsCount} friends</span>
              </div>
              <div className="flex items-center space-x-1">
                <Calendar className="w-4 h-4" />
                <span>Joined {format(new Date(user.createdAt), 'MMM yyyy')}</span>
              </div>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <button className="btn btn-primary">
              Follow
            </button>
            <button className="btn btn-outline">
              Message
            </button>
          </div>
        </div>
      </div>

      {/* User Posts */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          Posts ({posts.length})
        </h2>
        
        {posts.length === 0 ? (
          <div className="text-center py-8">
            <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No posts yet</h3>
            <p className="text-gray-600">This user hasn't published any posts yet.</p>
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
                    <a href={`/posts/${post._id}`} className="hover:text-primary-600">
                      {post.title}
                    </a>
                  </h3>
                  
                  {post.excerpt && (
                    <p className="text-gray-600 mb-4 line-clamp-3">
                      {post.excerpt}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center space-x-4">
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
    </div>
  )
}

export default UserProfile
