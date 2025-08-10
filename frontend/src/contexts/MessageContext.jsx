import { createContext, useContext, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from './AuthContext'
import api from '../utils/api'

const MessageContext = createContext()

export const useMessages = () => {
  const context = useContext(MessageContext)
  if (!context) {
    throw new Error('useMessages must be used within a MessageProvider')
  }
  return context
}

export const MessageProvider = ({ children }) => {
  const { user } = useAuth()
  const [conversations, setConversations] = useState([])
  const [currentConversation, setCurrentConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const navigate = useNavigate()

  // Fetch conversations when user is logged in
  useEffect(() => {
    if (user) {
      fetchConversations()
      fetchUnreadCount()
    }
  }, [user])

  // Fetch all conversations
  const fetchConversations = async () => {
    if (!user) return

    try {
      console.log('Fetching conversations')
      const response = await api.get('/api/messages/conversations')
      console.log('Conversations response:', response.data)
      setConversations(response.data.conversations || [])
      return response.data
    } catch (error) {
      console.error('Error fetching conversations:', error)
      console.error('Error details:', error.response?.data || error.message)
      toast.error('Failed to load conversations')
      return null
    } finally {
      setLoading(false)
    }
  }

  // Fetch unread message count
  const fetchUnreadCount = async () => {
    if (!user) return

    try {
      console.log('Fetching unread count')
      const response = await api.get('/api/messages/unread/count')
      console.log('Unread count response:', response.data)
      setUnreadCount(response.data.unreadCount || 0)
    } catch (error) {
      console.error('Error fetching unread count:', error)
      console.error('Error details:', error.response?.data || error.message)
    }
  }

  // Fetch messages for a conversation
  const fetchMessages = async (userId, page = 1) => {
    if (!user) return

    try {
      setLoading(true)
      console.log(`Fetching messages for user ${userId}`)
      const response = await api.get(`/api/messages/${userId}?page=${page}&limit=20`)
      console.log('Messages response:', response.data)
      setMessages(response.data.messages || [])
      setCurrentConversation(userId)
      
      // Mark messages as read
      if (response.data.messages?.some(msg => !msg.read && msg.sender._id !== user._id)) {
        console.log('Marking messages as read')
        await api.put(`/api/messages/${userId}/read`)
        fetchUnreadCount() // Update unread count
      }
      
      return response.data
    } catch (error) {
      console.error('Error fetching messages:', error)
      console.error('Error details:', error.response?.data || error.message)
      toast.error(error.response?.data?.message || 'Failed to load conversation')
      return null
    } finally {
      setLoading(false)
    }
  }

  // Send a message
  const sendMessage = async (userId, content) => {
    if (!user) return null

    try {
      console.log(`Sending message to user ${userId}:`, content)
      const response = await api.post(`/api/messages/${userId}`, { content })
      console.log('Send message response:', response.data)
      
      // Update messages list with the new message
      if (currentConversation === userId) {
        setMessages(prevMessages => [response.data.data, ...prevMessages])
      }
      
      // Update conversations list
      fetchConversations()
      
      return response.data.data
    } catch (error) {
      console.error('Error sending message:', error)
      console.error('Error details:', error.response?.data || error.message)
      toast.error(error.response?.data?.message || 'Failed to send message')
      return null
    }
  }

  return (
    <MessageContext.Provider
      value={{
        conversations,
        messages,
        loading,
        unreadCount,
        currentConversation,
        fetchConversations,
        fetchMessages,
        sendMessage,
        fetchUnreadCount
      }}
    >
      {children}
    </MessageContext.Provider>
  )
}