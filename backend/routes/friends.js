const express = require('express');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @desc    Send friend request
// @route   POST /api/friends/request/:userId
// @access  Private
router.post('/request/:userId', protect, async (req, res) => {
  try {
    console.log(`Friend request: User ${req.user._id} sending request to ${req.params.userId}`);
    
    if (req.params.userId === req.user._id.toString()) {
      console.log('Error: User trying to send friend request to themselves');
      return res.status(400).json({ message: 'You cannot send friend request to yourself' });
    }

    const targetUser = await User.findById(req.params.userId);
    if (!targetUser) {
      console.log(`Error: Target user ${req.params.userId} not found`);
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if already friends
    const currentUser = await User.findById(req.user._id);
    if (currentUser.friends.includes(req.params.userId)) {
      console.log(`Error: Users ${req.user._id} and ${req.params.userId} are already friends`);
      return res.status(400).json({ message: 'Already friends with this user' });
    }

    // Check if friend request already exists
    const existingRequest = targetUser.friendRequests.find(
      request => request.from.toString() === req.user._id.toString()
    );

    if (existingRequest) {
      console.log(`Error: Friend request already exists from ${req.user._id} to ${req.params.userId}`);
      return res.status(400).json({ message: 'Friend request already sent' });
    }

    // Add friend request
    targetUser.friendRequests.push({
      from: req.user._id,
      status: 'pending'
    });
    await targetUser.save();

    console.log(`Success: Friend request sent from ${req.user._id} to ${req.params.userId}`);
    res.json({
      success: true,
      message: 'Friend request sent successfully'
    });
  } catch (error) {
    console.error('Send friend request error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @desc    Accept friend request
// @route   PUT /api/friends/accept/:userId
// @access  Private
router.put('/accept/:userId', protect, async (req, res) => {
  try {
    console.log(`Accepting friend request: User ${req.user._id} accepting request from ${req.params.userId}`);
    
    const currentUser = await User.findById(req.user._id);
    const requestingUser = await User.findById(req.params.userId);

    if (!requestingUser) {
      console.log(`Error: Requesting user ${req.params.userId} not found`);
      return res.status(404).json({ message: 'User not found' });
    }

    if (!currentUser) {
      console.log(`Error: Current user ${req.user._id} not found`);
      return res.status(404).json({ message: 'Current user not found' });
    }

    // Find the friend request
    const friendRequest = currentUser.friendRequests.find(
      request => request.from.toString() === req.params.userId
    );

    if (!friendRequest) {
      console.log(`Error: Friend request not found from ${req.params.userId} to ${req.user._id}`);
      console.log('Current user friend requests:', currentUser.friendRequests.map(r => ({ from: r.from, status: r.status })));
      return res.status(404).json({ message: 'Friend request not found' });
    }

    if (friendRequest.status !== 'pending') {
      console.log(`Error: Friend request status is ${friendRequest.status}, not pending`);
      return res.status(400).json({ message: 'Friend request already processed' });
    }

    // Check if already friends
    if (currentUser.friends.includes(req.params.userId) || requestingUser.friends.includes(req.user._id)) {
      console.log(`Error: Users are already friends`);
      return res.status(400).json({ message: 'Users are already friends' });
    }

    // Add to friends list for both users
    currentUser.friends.push(req.params.userId);
    requestingUser.friends.push(req.user._id);

    // Remove friend request from current user
    currentUser.friendRequests = currentUser.friendRequests.filter(
      request => request.from.toString() !== req.params.userId
    );

    // Save both users
    await Promise.all([currentUser.save(), requestingUser.save()]);

    console.log(`Success: Friend request accepted between ${req.user._id} and ${req.params.userId}`);
    res.json({
      success: true,
      message: 'Friend request accepted successfully'
    });
  } catch (error) {
    console.error('Accept friend request error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ message: 'Server error', error: error.message });
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

// @desc    Get incoming friend requests
// @route   GET /api/friends/requests
// @access  Private
router.get('/requests', protect, async (req, res) => {
  try {
    console.log(`Getting friend requests for user: ${req.user._id}`);
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const currentUser = await User.findById(req.user._id)
      .populate({
        path: 'friendRequests.from',
        select: 'username firstName lastName avatar bio'
      });

    if (!currentUser) {
      console.log(`User ${req.user._id} not found`);
      return res.status(404).json({ message: 'User not found' });
    }

    console.log(`User found. Total friend requests: ${currentUser.friendRequests.length}`);

    const pendingRequests = currentUser.friendRequests.filter(
      request => request.status === 'pending' && request.from
    );

    console.log(`Pending requests after filtering: ${pendingRequests.length}`);

    const total = pendingRequests.length;
    const paginatedRequests = pendingRequests.slice(skip, skip + parseInt(limit));

    console.log(`Returning ${paginatedRequests.length} requests`);

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
    console.error('Error stack:', error.stack);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @desc    Get outgoing friend requests (sent by current user)
// @route   GET /api/friends/requests/sent
// @access  Private
router.get('/requests/sent', protect, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    // Find users who have pending friend requests from the current user
    const usersWithOutgoingRequests = await User.find({
      'friendRequests.from': req.user._id,
      'friendRequests.status': 'pending'
    })
    .select('username firstName lastName avatar bio')
    .limit(parseInt(limit))
    .skip(skip);

    const total = await User.countDocuments({
      'friendRequests.from': req.user._id,
      'friendRequests.status': 'pending'
    });

    res.json({
      success: true,
      sentRequests: usersWithOutgoingRequests,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get sent friend requests error:', error);
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

// @desc    Get user suggestions (all users except friends and current user)
// @route   GET /api/friends/suggestions
// @access  Private
router.get('/suggestions', protect, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const currentUser = await User.findById(req.user._id);
    
    // Show all users except current user and existing friends
    // This allows sending friend requests to anyone, including those with pending requests
    const suggestions = await User.find({
      _id: {
        $ne: req.user._id,
        $nin: currentUser.friends
      }
    })
    .select('username firstName lastName avatar bio followersCount followingCount friendsCount')
    .sort({ createdAt: -1, followersCount: -1 }) // Sort by newest users first, then by popularity
    .limit(parseInt(limit))
    .skip(skip);

    const total = await User.countDocuments({
      _id: {
        $ne: req.user._id,
        $nin: currentUser.friends
      }
    });

    console.log(`Suggestions for user ${req.user._id}: Found ${total} total users, returning ${suggestions.length} users`);

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
