import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useMessages } from '../../contexts/MessageContext'
import { useAuth } from '../../contexts/AuthContext'
import { Mail, Send, ArrowLeft, User } from 'lucide-react'

const Messages = () => {
  const { userId } = useParams()
  const { user } = useAuth()
  const { 
    conversations, 
    messages, 
    loading, 
    currentConversation,
    fetchConversations, 
    fetchMessages, 
    sendMessage 
  } = useMessages()
  const [messageText, setMessageText] = useState('')
  const [selectedUser, setSelectedUser] = useState(null)
  const messagesEndRef = useRef(null)
  const navigate = useNavigate()

  // Fetch conversations on component mount
  useEffect(() => {
    fetchConversations()
  }, [])

  // Fetch messages when userId changes
  useEffect(() => {
    if (userId) {
      fetchMessages(userId)
      const selectedConversation = conversations.find(conv => conv.user._id === userId)
      setSelectedUser(selectedConversation?.user || null)
    }
  }, [userId, conversations])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!messageText.trim() || !userId) return

    const success = await sendMessage(userId, messageText.trim())
    if (success) {
      setMessageText('')
    }
  }

  const handleSelectConversation = (userId) => {
    navigate(`/messages/${userId}`)
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const isToday = date.toDateString() === now.toDateString()
    
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-6 bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        {/* Conversations sidebar */}
        <div className="w-full md:w-1/3 border-r border-gray-200 dark:border-gray-700">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white flex items-center gap-2">
              <Mail className="h-5 w-5" /> Messages
            </h2>
          </div>
          
          <div className="overflow-y-auto h-[calc(80vh-120px)]">
            {loading && !conversations.length ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                No conversations yet
              </div>
            ) : (
              conversations.map((conversation) => (
                <div 
                  key={conversation.user._id}
                  onClick={() => handleSelectConversation(conversation.user._id)}
                  className={`p-4 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors ${currentConversation === conversation.user._id ? 'bg-blue-50 dark:bg-gray-700' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    {conversation.user.avatar ? (
                      <img 
                        src={conversation.user.avatar} 
                        alt={conversation.user.username} 
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                        <User className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <h3 className="font-medium text-gray-800 dark:text-white">
                          {conversation.user.firstName} {conversation.user.lastName}
                        </h3>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {conversation.lastMessage && formatDate(conversation.lastMessage.createdAt)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-gray-600 dark:text-gray-300 truncate max-w-[180px]">
                          {conversation.lastMessage && conversation.lastMessage.sender && 
                            conversation.lastMessage.sender._id === user._id ? 'You: ' : ''}
                          {conversation.lastMessage && conversation.lastMessage.content}
                        </p>
                        {conversation.unreadCount > 0 && (
                          <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                            {conversation.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Message area */}
        <div className="flex-1 flex flex-col">
          {!userId ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <Mail className="h-16 w-16 text-gray-300 dark:text-gray-600 mb-4" />
              <h3 className="text-xl font-medium text-gray-700 dark:text-gray-300 mb-2">Your Messages</h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-md">
                Select a conversation from the sidebar or start a new conversation from your friends list.
              </p>
            </div>
          ) : (
            <>
              {/* Conversation header */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center">
                <button 
                  onClick={() => navigate('/messages')} 
                  className="md:hidden mr-2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                </button>
                
                {selectedUser && (
                  <div className="flex items-center gap-3">
                    {selectedUser.avatar ? (
                      <img 
                        src={selectedUser.avatar} 
                        alt={selectedUser.username} 
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                        <User className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-medium text-gray-800 dark:text-white">
                        {selectedUser.firstName} {selectedUser.lastName}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        @{selectedUser.username}
                      </p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 h-[calc(80vh-200px)]">
                {loading && !messages.length ? (
                  <div className="flex justify-center items-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                    No messages yet. Start the conversation!
                  </div>
                ) : (
                  messages.map((message) => {
                    const isOwnMessage = message.sender._id === user._id
                    
                    return (
                      <div 
                        key={message._id} 
                        className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                      >
                        <div 
                          className={`max-w-[75%] rounded-lg px-4 py-2 ${isOwnMessage 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white'}`}
                        >
                          <p>{message.content}</p>
                          <div className={`text-xs mt-1 ${isOwnMessage ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}`}>
                            {formatDate(message.createdAt)}
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={messagesEndRef} />
              </div>
              
              {/* Message input */}
              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <input
                    type="text"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 rounded-full border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                  />
                  <button
                    type="submit"
                    disabled={!messageText.trim()}
                    className="rounded-full bg-blue-500 p-2 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors"
                  >
                    <Send className="h-5 w-5" />
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default Messages