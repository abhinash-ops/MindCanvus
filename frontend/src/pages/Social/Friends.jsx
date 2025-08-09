import { useState, useEffect } from 'react'
import { Users, UserPlus, UserCheck, UserX, Mail } from 'lucide-react'
import api from '../../utils/api'
import toast from 'react-hot-toast'

const Friends = () => {
  const [friends, setFriends] = useState([])
  const [requests, setRequests] = useState([])
  const [suggestions, setSuggestions] = useState([])
  const [activeTab, setActiveTab] = useState('friends')
  const [loading, setLoading] = useState(true)
  const [sendingRequest, setSendingRequest] = useState(null)
  const [outgoingRequests, setOutgoingRequests] = useState([])
  const [processingRequest, setProcessingRequest] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchFriendsData()
  }, [])

  const fetchFriendsData = async () => {
    try {
      setError(null) // Clear any previous errors
      const [friendsResponse, requestsResponse, suggestionsResponse, sentRequestsResponse] = await Promise.all([
        api.get('/friends'),
        api.get('/friends/requests'),
        api.get('/friends/suggestions'),
        api.get('/friends/requests/sent')
      ])
      
      console.log('Raw API responses:', {
        friends: friendsResponse.data,
        requests: requestsResponse.data,
        suggestions: suggestionsResponse.data,
        sentRequests: sentRequestsResponse.data
      })
      
      setFriends(friendsResponse.data.friends || [])
      setRequests(requestsResponse.data.requests || [])
      setSuggestions(suggestionsResponse.data.suggestions || [])
      setOutgoingRequests(sentRequestsResponse.data.sentRequests || [])
      
      console.log('Friends data loaded:', {
        friends: friendsResponse.data.friends?.length || 0,
        requests: requestsResponse.data.requests?.length || 0,
        suggestions: suggestionsResponse.data.suggestions?.length || 0,
        outgoingRequests: sentRequestsResponse.data.sentRequests?.length || 0
      })
    } catch (error) {
      console.error('Error fetching friends data:', error)
      console.error('Error details:', error.response?.data || error.message)
      // Set empty arrays on error to prevent blank screen
      setFriends([])
      setRequests([])
      setSuggestions([])
      setOutgoingRequests([])
      setError(error.response?.data?.message || error.message || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleAcceptRequest = async (userId) => {
    if (processingRequest === userId) return // Prevent double clicks
    
    try {
      setProcessingRequest(userId)
      console.log(`Accepting friend request from user: ${userId}`)
      const response = await api.put(`/friends/accept/${userId}`)
      console.log('Accept friend request response:', response.data)
      fetchFriendsData()
      toast.success('Friend request accepted!')
    } catch (error) {
      console.error('Error accepting friend request:', error)
      console.error('Error details:', error.response?.data || error.message)
      const errorMessage = error.response?.data?.message || 'Failed to accept friend request'
      toast.error(errorMessage)
    } finally {
      setProcessingRequest(null)
    }
  }

  const handleRejectRequest = async (userId) => {
    if (processingRequest === userId) return // Prevent double clicks
    
    try {
      setProcessingRequest(userId)
      console.log(`Rejecting friend request from user: ${userId}`)
      const response = await api.put(`/friends/reject/${userId}`)
      console.log('Reject friend request response:', response.data)
      fetchFriendsData()
      toast.success('Friend request rejected')
    } catch (error) {
      console.error('Error rejecting friend request:', error)
      console.error('Error details:', error.response?.data || error.message)
      const errorMessage = error.response?.data?.message || 'Failed to reject friend request'
      toast.error(errorMessage)
    } finally {
      setProcessingRequest(null)
    }
  }

  const handleSendRequest = async (userId) => {
    if (sendingRequest === userId) return // Prevent double clicks
    
    try {
      setSendingRequest(userId)
      const response = await api.post(`/friends/request/${userId}`)
      console.log('Friend request response:', response.data)
      fetchFriendsData()
      toast.success('Friend request sent!')
    } catch (error) {
      console.error('Error sending friend request:', error)
      console.error('Error details:', error.response?.data || error.message)
      const errorMessage = error.response?.data?.message || 'Failed to send friend request'
      toast.error(errorMessage)
    } finally {
      setSendingRequest(null)
    }
  }

  const handleRemoveFriend = async (userId) => {
    try {
      await api.delete(`/friends/${userId}`)
      fetchFriendsData()
      toast.success('Friend removed')
    } catch (error) {
      console.error('Error removing friend:', error)
      toast.error('Failed to remove friend')
    }
  }

  // Helper function to check if friend request has been sent to a user
  const hasRequestBeenSent = (userId) => {
    return outgoingRequests.some(request => request._id === userId)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Friends</h1>
        <p className="text-gray-600">Manage your friends and connections.</p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-8 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('friends')}
          className={`pb-2 px-1 border-b-2 font-medium text-sm ${
            activeTab === 'friends'
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Friends ({friends.length})
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`pb-2 px-1 border-b-2 font-medium text-sm ${
            activeTab === 'requests'
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Requests ({requests.length})
        </button>
        <button
          onClick={() => setActiveTab('suggestions')}
          className={`pb-2 px-1 border-b-2 font-medium text-sm ${
            activeTab === 'suggestions'
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          All Users ({suggestions.length})
        </button>
      </div>

      {/* Content */}
      <div className="card p-6">
        {activeTab === 'friends' && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Your Friends</h2>
            
            {friends.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No friends yet</h3>
                <p className="text-gray-600 mb-4">Start connecting with people to build your network.</p>
                <button
                  onClick={() => setActiveTab('suggestions')}
                  className="btn btn-primary"
                >
                  Find People
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {friends.map((friend) => (
                  <div key={friend._id} className="card p-4">
                    <div className="flex items-center space-x-4">
                      <img
                        src={friend.avatar || `https://ui-avatars.com/api/?name=${friend.firstName}+${friend.lastName}&background=6366f1&color=fff`}
                        alt={friend.username}
                        className="w-12 h-12 rounded-full"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">
                          {friend.firstName} {friend.lastName}
                        </h3>
                        <p className="text-gray-600 text-sm">@{friend.username}</p>
                        {friend.bio && (
                          <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                            {friend.bio}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="mt-4 flex space-x-2">
                      <button className="flex-1 btn btn-outline text-sm">
                        <Mail className="w-4 h-4 mr-1" />
                        Message
                      </button>
                      <button 
                        onClick={() => handleRemoveFriend(friend._id)}
                        className="btn btn-outline text-sm text-red-600 hover:text-red-700"
                      >
                        <UserX className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'requests' && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Friend Requests</h2>
            
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading requests...</p>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <div className="text-red-500 mb-4">
                  <UserX className="w-12 h-12 mx-auto mb-2" />
                  <h3 className="text-lg font-medium">Error loading requests</h3>
                  <p className="text-sm mt-2">{error}</p>
                </div>
                <button 
                  onClick={() => {
                    setError(null)
                    fetchFriendsData()
                  }}
                  className="btn btn-primary"
                >
                  Try Again
                </button>
              </div>
            ) : requests.length === 0 ? (
              <div className="text-center py-8">
                <UserPlus className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No pending requests</h3>
                <p className="text-gray-600">You don't have any pending friend requests.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {requests.map((request) => {
                  // Safety check for request data structure
                  if (!request || !request.from) {
                    console.warn('Invalid request data:', request)
                    return null
                  }
                  
                  return (
                    <div key={request.from._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <img
                          src={request.from.avatar || `https://ui-avatars.com/api/?name=${request.from.firstName || 'User'}+${request.from.lastName || ''}&background=6366f1&color=fff`}
                          alt={request.from.username || 'User'}
                          className="w-12 h-12 rounded-full"
                        />
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {request.from.firstName} {request.from.lastName}
                          </h3>
                          <p className="text-gray-600 text-sm">@{request.from.username}</p>
                        </div>
                      </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleAcceptRequest(request.from._id)}
                        disabled={processingRequest === request.from._id}
                        className={`btn btn-primary text-sm ${
                          processingRequest === request.from._id 
                            ? 'opacity-50 cursor-not-allowed' 
                            : ''
                        }`}
                      >
                        {processingRequest === request.from._id ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-1"></div>
                            Processing...
                          </>
                        ) : (
                          <>
                            <UserCheck className="w-4 h-4 mr-1" />
                            Accept
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleRejectRequest(request.from._id)}
                        disabled={processingRequest === request.from._id}
                        className={`btn btn-outline text-sm text-red-600 hover:text-red-700 ${
                          processingRequest === request.from._id 
                            ? 'opacity-50 cursor-not-allowed' 
                            : ''
                        }`}
                      >
                        {processingRequest === request.from._id ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-1"></div>
                            Processing...
                          </>
                        ) : (
                          <>
                            <UserX className="w-4 h-4 mr-1" />
                            Decline
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'suggestions' && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">All Registered Users</h2>
            
            {suggestions.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No suggestions</h3>
                <p className="text-gray-600">We couldn't find any suggestions for you right now.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {suggestions.map((user) => (
                  <div key={user._id} className="card p-4">
                    <div className="flex items-center space-x-4">
                      <img
                        src={user.avatar || `https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}&background=6366f1&color=fff`}
                        alt={user.username}
                        className="w-12 h-12 rounded-full"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">
                          {user.firstName} {user.lastName}
                        </h3>
                        <p className="text-gray-600 text-sm">@{user.username}</p>
                        {user.bio && (
                          <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                            {user.bio}
                          </p>
                        )}
                        <p className="text-gray-500 text-xs mt-1">
                          {user.followersCount} followers
                        </p>
                      </div>
                    </div>
                    <div className="mt-4">
                      {hasRequestBeenSent(user._id) ? (
                        <button
                          disabled
                          className="w-full btn btn-secondary text-sm opacity-75 cursor-not-allowed"
                        >
                          <UserCheck className="w-4 h-4 mr-1" />
                          Request Sent
                        </button>
                      ) : (
                        <button
                          onClick={() => handleSendRequest(user._id)}
                          disabled={sendingRequest === user._id}
                          className={`w-full btn btn-outline text-sm ${
                            sendingRequest === user._id 
                              ? 'opacity-50 cursor-not-allowed' 
                              : ''
                          }`}
                        >
                          {sendingRequest === user._id ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-1"></div>
                              Sending...
                            </>
                          ) : (
                            <>
                              <UserPlus className="w-4 h-4 mr-1" />
                              Add Friend
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default Friends
