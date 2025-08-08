const express = require('express');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @desc    Send friend request
// @route   POST /api/friends/request/:userId
// @access  Private
router.post('/request/:userId', protect, async (req, res) => {
  try {
    if (req.params.userId === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot send friend request to yourself' });
    }

    const targetUser = await User.findById(req.params.userId);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if already friends
    const currentUser = await User.findById(req.user._id);
    if (currentUser.friends.includes(req.params.userId)) {
      return res.status(400).json({ message: 'Already friends with this user' });
    }

    // Check if friend request already exists
    const existingRequest = targetUser.friendRequests.find(
      request => request.from.toString() === req.user._id.toString()
    );

    if (existingRequest) {
      return res.status(400).json({ message: 'Friend request already sent' });
    }

    // Add friend request
    targetUser.friendRequests.push({
      from: req.user._id,
      status: 'pending'
    });
    await targetUser.save();

    res.json({
      success: true,
      message: 'Friend request sent successfully'
    });
  } catch (error) {
    console.error('Send friend request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Accept friend request
// @route   PUT /api/friends/accept/:userId
// @access  Private
router.put('/accept/:userId', protect, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id);
    const requestingUser = await User.findById(req.params.userId);

    if (!requestingUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Find the friend request
    const friendRequest = currentUser.friendRequests.find(
      request => request.from.toString() === req.params.userId
    );

    if (!friendRequest) {
      return res.status(404).json({ message: 'Friend request not found' });
    }

    if (friendRequest.status !== 'pending') {
      return res.status(400).json({ message: 'Friend request already processed' });
    }

    // Update friend request status
    friendRequest.status = 'accepted';
    await currentUser.save();

    // Add to friends list for both users
    currentUser.friends.push(req.params.userId);
    requestingUser.friends.push(req.user._id);

    // Remove friend request from both users
    currentUser.friendRequests = currentUser.friendRequests.filter(
      request => request.from.toString() !== req.params.userId
    );

    await currentUser.save();
    await requestingUser.save();

    res.json({
      success: true,
      message: 'Friend request accepted successfully'
    });
  } catch (error) {
    console.error('Accept friend request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Reject friend request
// @route   PUT /api/friends/reject/:userId
// @access  Private
router.put('/reject/:userId', protect, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id);

    // Find the friend request
    const friendRequest = currentUser.friendRequests.find(
      request => request.from.toString() === req.params.userId
    );

    if (!friendRequest) {
      return res.status(404).json({ message: 'Friend request not found' });
    }

    if (friendRequest.status !== 'pending') {
      return res.status(400).json({ message: 'Friend request already processed' });
    }

    // Update friend request status
    friendRequest.status = 'rejected';
    await currentUser.save();

    res.json({
      success: true,
      message: 'Friend request rejected successfully'
    });
  } catch (error) {
    console.error('Reject friend request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Remove friend
// @route   DELETE /api/friends/:userId
// @access  Private
router.delete('/:userId', protect, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id);
    const friendUser = await User.findById(req.params.userId);

    if (!friendUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if they are friends
    if (!currentUser.friends.includes(req.params.userId)) {
      return res.status(400).json({ message: 'Not friends with this user' });
    }

    // Remove from friends list for both users
    currentUser.friends = currentUser.friends.filter(
      id => id.toString() !== req.params.userId
    );
    friendUser.friends = friendUser.friends.filter(
      id => id.toString() !== req.user._id.toString()
    );

    await currentUser.save();
    await friendUser.save();

    res.json({
      success: true,
      message: 'Friend removed successfully'
    });
  } catch (error) {
    console.error('Remove friend error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get friend requests
// @route   GET /api/friends/requests
// @access  Private
router.get('/requests', protect, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const currentUser = await User.findById(req.user._id)
      .populate({
        path: 'friendRequests.from',
        select: 'username firstName lastName avatar bio',
        match: { 'friendRequests.status': 'pending' }
      });

    const pendingRequests = currentUser.friendRequests.filter(
      request => request.status === 'pending'
    );

    const total = pendingRequests.length;
    const paginatedRequests = pendingRequests.slice(skip, skip + parseInt(limit));

    res.json({
      success: true,
      requests: paginatedRequests,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get friend requests error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get friends list
// @route   GET /api/friends
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const currentUser = await User.findById(req.user._id)
      .populate({
        path: 'friends',
        select: 'username firstName lastName avatar bio',
        options: {
          limit: parseInt(limit),
          skip
        }
      });

    const total = currentUser.friends.length;

    res.json({
      success: true,
      friends: currentUser.friends,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get friends error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Cancel friend request
// @route   DELETE /api/friends/request/:userId
// @access  Private
router.delete('/request/:userId', protect, async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.userId);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Remove friend request
    targetUser.friendRequests = targetUser.friendRequests.filter(
      request => request.from.toString() !== req.user._id.toString()
    );
    await targetUser.save();

    res.json({
      success: true,
      message: 'Friend request cancelled successfully'
    });
  } catch (error) {
    console.error('Cancel friend request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get user suggestions
// @route   GET /api/friends/suggestions
// @access  Private
router.get('/suggestions', protect, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const currentUser = await User.findById(req.user._id);
    
    // Get users who are not friends, not in friend requests, and not the current user
    const suggestions = await User.find({
      _id: {
        $ne: req.user._id,
        $nin: currentUser.friends,
        $nin: currentUser.friendRequests.map(req => req.from)
      }
    })
    .select('username firstName lastName avatar bio followersCount followingCount friendsCount')
    .sort({ followersCount: -1, createdAt: -1 }) // Sort by popularity and recent activity
    .limit(parseInt(limit))
    .skip(skip);

    const total = await User.countDocuments({
      _id: {
        $ne: req.user._id,
        $nin: currentUser.friends,
        $nin: currentUser.friendRequests.map(req => req.from)
      }
    });

    res.json({
      success: true,
      suggestions,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get user suggestions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
