import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { format } from 'date-fns'
import { Eye, Heart, MessageCircle, Share, Send, X } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import api from '../../utils/api'
import toast from 'react-hot-toast'

const PostDetail = () => {
  const { id } = useParams()
  const { user } = useAuth()
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isLiked, setIsLiked] = useState(false)
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [showCommentForm, setShowCommentForm] = useState(false)
  const [commentLoading, setCommentLoading] = useState(false)

  useEffect(() => {
    fetchPost()
    fetchComments()
  }, [id])

  useEffect(() => {
    if (post && user) {
      setIsLiked(post.likes.some(like => like.user === user._id))
    }
  }, [post, user])

  const fetchPost = async () => {
    try {
      const response = await api.get(`/posts/${id}`)
      setPost(response.data.post)
    } catch (error) {
      console.error('Error fetching post:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchComments = async () => {
    try {
      const response = await api.get(`/comments/post/${id}`)
      setComments(response.data.comments)
    } catch (error) {
      console.error('Error fetching comments:', error)
    }
  }

  const handleLike = async () => {
    if (!user) {
      toast.error('Please login to like posts')
      return
    }

    try {
      const response = await api.post(`/posts/${id}/like`)
      setIsLiked(response.data.isLiked)
      setPost(prev => ({
        ...prev,
        likesCount: response.data.likesCount
      }))
      toast.success(response.data.message)
    } catch (error) {
      console.error('Error liking post:', error)
      toast.error('Failed to like post')
    }
  }

  const handleShare = async () => {
    try {
      const response = await api.post(`/posts/${id}/share`)
      
      // Copy to clipboard
      await navigator.clipboard.writeText(response.data.shareUrl)
      toast.success('Post URL copied to clipboard!')
    } catch (error) {
      console.error('Error sharing post:', error)
      toast.error('Failed to share post')
    }
  }

  const handleComment = async (e) => {
    e.preventDefault()
    if (!user) {
      toast.error('Please login to comment')
      return
    }

    if (!newComment.trim()) {
      toast.error('Please enter a comment')
      return
    }

    setCommentLoading(true)
    try {
      await api.post('/comments', {
        post: id,
        content: newComment.trim()
      })
      
      setNewComment('')
      setShowCommentForm(false)
      fetchComments()
      toast.success('Comment added successfully!')
    } catch (error) {
      console.error('Error adding comment:', error)
      toast.error('Failed to add comment')
    } finally {
      setCommentLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Post not found</h1>
          <p className="text-gray-600">The post you're looking for doesn't exist.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <article className="card p-8">
        {/* Post Header */}
        <header className="mb-8">
          <div className="flex items-center space-x-2 mb-4">
            <span className="px-3 py-1 bg-primary-100 text-primary-800 text-sm font-medium rounded-full">
              {post.category}
            </span>
            <span className="text-gray-500 text-sm">
              {format(new Date(post.publishedAt), 'MMM dd, yyyy')}
            </span>
          </div>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {post.title}
          </h1>
          
          {post.excerpt && (
            <p className="text-xl text-gray-600 mb-6">
              {post.excerpt}
            </p>
          )}
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <img
                src={post.author.avatar || `https://ui-avatars.com/api/?name=${post.author.firstName}+${post.author.lastName}&background=6366f1&color=fff`}
                alt={post.author.username}
                className="w-12 h-12 rounded-full"
              />
              <div>
                <p className="font-semibold text-gray-900">
                  {post.author.firstName} {post.author.lastName}
                </p>
                <p className="text-gray-600 text-sm">@{post.author.username}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-6 text-sm text-gray-500">
              <div className="flex items-center space-x-1">
                <Eye className="w-4 h-4" />
                <span>{post.views} views</span>
              </div>
              <div className="flex items-center space-x-1">
                <Heart className="w-4 h-4" />
                <span>{post.likesCount} likes</span>
              </div>
              <div className="flex items-center space-x-1">
                <MessageCircle className="w-4 h-4" />
                <span>{post.commentsCount || 0} comments</span>
              </div>
            </div>
          </div>
        </header>

        {/* Featured Image */}
        {post.featuredImage && (
          <div className="mb-8">
            <img
              src={post.featuredImage}
              alt={post.title}
              className="w-full h-64 md:h-96 object-cover rounded-lg"
            />
          </div>
        )}

        {/* Post Content */}
        <div className="prose prose-lg max-w-none">
          <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
            {post.content}
          </div>
        </div>

        {/* Post Footer */}
        <footer className="mt-8 pt-8 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button 
                onClick={handleLike}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  isLiked 
                    ? 'bg-red-600 text-white hover:bg-red-700' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                <span>{isLiked ? 'Liked' : 'Like'}</span>
              </button>
              <button 
                onClick={() => setShowCommentForm(!showCommentForm)}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Comment</span>
              </button>
            </div>
            
            <button 
              onClick={handleShare}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              <Share className="w-4 h-4" />
              <span>Share</span>
            </button>
          </div>

          {/* Comment Form */}
          {showCommentForm && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <form onSubmit={handleComment} className="space-y-4">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write your comment..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  rows="3"
                  maxLength="1000"
                />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">
                    {newComment.length}/1000 characters
                  </span>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setShowCommentForm(false)}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <button
                      type="submit"
                      disabled={commentLoading || !newComment.trim()}
                      className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                    >
                      <Send className="w-4 h-4" />
                      <span>{commentLoading ? 'Posting...' : 'Post Comment'}</span>
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}
        </footer>
      </article>

      {/* Comments Section */}
      <div className="mt-8 card p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">
          Comments ({comments.length})
        </h3>
        
        {comments.length === 0 ? (
          <div className="text-center py-8">
            <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">No comments yet</h4>
            <p className="text-gray-600">Be the first to share your thoughts!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {comments.map((comment) => (
              <div key={comment._id} className="border-b border-gray-200 pb-6 last:border-b-0">
                <div className="flex items-start space-x-3">
                  <img
                    src={comment.author.avatar || `https://ui-avatars.com/api/?name=${comment.author.firstName}+${comment.author.lastName}&background=6366f1&color=fff`}
                    alt={comment.author.username}
                    className="w-8 h-8 rounded-full"
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="font-medium text-gray-900">
                        {comment.author.firstName} {comment.author.lastName}
                      </span>
                      <span className="text-gray-500 text-sm">
                        {format(new Date(comment.createdAt), 'MMM dd, yyyy')}
                      </span>
                      {comment.isEdited && (
                        <span className="text-xs text-gray-400">(edited)</span>
                      )}
                    </div>
                    <p className="text-gray-800 mb-2">{comment.content}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <button className="flex items-center space-x-1 hover:text-primary-600">
                        <Heart className="w-3 h-3" />
                        <span>{comment.likesCount || 0}</span>
                      </button>
                      <button className="flex items-center space-x-1 hover:text-primary-600">
                        <MessageCircle className="w-3 h-3" />
                        <span>Reply</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default PostDetail
