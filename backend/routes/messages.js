const express = require('express');
const { body, validationResult } = require('express-validator');
const Message = require('../models/Message');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @desc    Get all conversations for the logged-in user
// @route   GET /api/messages/conversations
// @access  Private
router.get('/conversations', protect, async (req, res) => {
  try {
    const conversations = await Message.getUserConversations(req.user._id);
    
    res.json({
      success: true,
      conversations
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get conversation between logged-in user and another user
// @route   GET /api/messages/:userId
// @access  Private
router.get('/:userId', protect, async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Get messages
    const messages = await Message.getConversation(
      req.user._id,
      userId,
      { page: parseInt(page), limit: parseInt(limit) }
    );
    
    // Mark messages as read
    const unreadMessages = messages.filter(
      message => !message.read && message.recipient._id.toString() === req.user._id.toString()
    );
    
    if (unreadMessages.length > 0) {
      await Promise.all(unreadMessages.map(message => message.markAsRead()));
    }
    
    // Count total messages for pagination
    const total = await Message.countDocuments({
      $or: [
        { sender: req.user._id, recipient: userId },
        { sender: userId, recipient: req.user._id }
      ]
    });
    
    res.json({
      success: true,
      messages,
      totalMessages: total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      hasNext: page * limit < total,
      hasPrev: page > 1
    });
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Send a message to another user
// @route   POST /api/messages/:userId
// @access  Private
router.post('/:userId', [
  protect,
  body('content')
    .notEmpty()
    .withMessage('Message content is required')
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Message cannot exceed 2000 characters')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array() 
      });
    }
    
    const { userId } = req.params;
    const { content } = req.body;
    
    // Check if recipient exists
    const recipient = await User.findById(userId);
    if (!recipient) {
      return res.status(404).json({ message: 'Recipient not found' });
    }
    
    // Check if users are friends
    const isFriend = req.user.friends.some(friend => friend.toString() === userId);
    if (!isFriend) {
      return res.status(403).json({ message: 'You can only message your friends' });
    }
    
    // Create message
    const message = await Message.create({
      sender: req.user._id,
      recipient: userId,
      content
    });
    
    // Populate sender and recipient
    await message.populate('sender', 'username firstName lastName avatar');
    await message.populate('recipient', 'username firstName lastName avatar');
    
    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: message
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Server error sending message' });
  }
});

// @desc    Mark all messages from a user as read
// @route   PUT /api/messages/:userId/read
// @access  Private
router.put('/:userId/read', protect, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Update all unread messages from this user
    const result = await Message.updateMany(
      { 
        sender: userId,
        recipient: req.user._id,
        read: false
      },
      {
        read: true,
        readAt: new Date()
      }
    );
    
    res.json({
      success: true,
      message: 'Messages marked as read',
      count: result.nModified
    });
  } catch (error) {
    console.error('Mark messages read error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get unread message count
// @route   GET /api/messages/unread/count
// @access  Private
router.get('/unread/count', protect, async (req, res) => {
  try {
    const count = await Message.countDocuments({
      recipient: req.user._id,
      read: false
    });
    
    res.json({
      success: true,
      unreadCount: count
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;