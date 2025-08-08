const express = require('express');
const User = require('../models/User');
const Post = require('../models/Post');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @desc    Get user profile
// @route   GET /api/users/:username
// @access  Public
router.get('/:username', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username })
      .populate('followers', 'username firstName lastName avatar')
      .populate('following', 'username firstName lastName avatar')
      .populate('friends', 'username firstName lastName avatar');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get user's published posts count
    const postsCount = await Post.countDocuments({
      author: user._id,
      status: 'published',
      publishedAt: { $lte: new Date() }
    });

    const profile = {
      ...user.getPublicProfile(),
      postsCount
    };

    res.json({
      success: true,
      user: profile
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Search users
// @route   GET /api/users/search
// @access  Public
router.get('/search', async (req, res) => {
  try {
    const { q, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    if (!q) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const query = {
      $or: [
        { username: { $regex: q, $options: 'i' } },
        { firstName: { $regex: q, $options: 'i' } },
        { lastName: { $regex: q, $options: 'i' } }
      ]
    };

    const users = await User.find(query)
      .select('username firstName lastName avatar bio followersCount followingCount friendsCount')
      .sort({ followersCount: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      users,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get suggested users to follow
// @route   GET /api/users/suggestions
// @access  Private
router.get('/suggestions', protect, async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    // Get users that the current user is not following and not friends with
    const currentUser = await User.findById(req.user._id);
    const followingIds = currentUser.following.map(id => id.toString());
    const friendsIds = currentUser.friends.map(id => id.toString());
    const excludeIds = [...followingIds, ...friendsIds, req.user._id.toString()];

    const suggestions = await User.find({
      _id: { $nin: excludeIds }
    })
      .select('username firstName lastName avatar bio followersCount')
      .sort({ followersCount: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      suggestions
    });
  } catch (error) {
    console.error('Get suggestions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Follow user
// @route   POST /api/users/:userId/follow
// @access  Private
router.post('/:userId/follow', protect, async (req, res) => {
  try {
    if (req.params.userId === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot follow yourself' });
    }

    const userToFollow = await User.findById(req.params.userId);
    if (!userToFollow) {
      return res.status(404).json({ message: 'User not found' });
    }

    const currentUser = await User.findById(req.user._id);

    // Check if already following
    const isFollowing = currentUser.following.includes(req.params.userId);
    if (isFollowing) {
      return res.status(400).json({ message: 'Already following this user' });
    }

    // Add to following
    currentUser.following.push(req.params.userId);
    await currentUser.save();

    // Add to followers
    userToFollow.followers.push(req.user._id);
    await userToFollow.save();

    res.json({
      success: true,
      message: 'User followed successfully'
    });
  } catch (error) {
    console.error('Follow user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Unfollow user
// @route   DELETE /api/users/:userId/follow
// @access  Private
router.delete('/:userId/follow', protect, async (req, res) => {
  try {
    const userToUnfollow = await User.findById(req.params.userId);
    if (!userToUnfollow) {
      return res.status(404).json({ message: 'User not found' });
    }

    const currentUser = await User.findById(req.user._id);

    // Check if following
    const isFollowing = currentUser.following.includes(req.params.userId);
    if (!isFollowing) {
      return res.status(400).json({ message: 'Not following this user' });
    }

    // Remove from following
    currentUser.following = currentUser.following.filter(
      id => id.toString() !== req.params.userId
    );
    await currentUser.save();

    // Remove from followers
    userToUnfollow.followers = userToUnfollow.followers.filter(
      id => id.toString() !== req.user._id.toString()
    );
    await userToUnfollow.save();

    res.json({
      success: true,
      message: 'User unfollowed successfully'
    });
  } catch (error) {
    console.error('Unfollow user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get user's followers
// @route   GET /api/users/:userId/followers
// @access  Public
router.get('/:userId/followers', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const user = await User.findById(req.params.userId)
      .populate({
        path: 'followers',
        select: 'username firstName lastName avatar bio',
        options: {
          limit: parseInt(limit),
          skip
        }
      });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const total = user.followers.length;

    res.json({
      success: true,
      followers: user.followers,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get followers error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get user's following
// @route   GET /api/users/:userId/following
// @access  Public
router.get('/:userId/following', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const user = await User.findById(req.params.userId)
      .populate({
        path: 'following',
        select: 'username firstName lastName avatar bio',
        options: {
          limit: parseInt(limit),
          skip
        }
      });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const total = user.following.length;

    res.json({
      success: true,
      following: user.following,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get following error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
