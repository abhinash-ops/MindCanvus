const express = require('express');
const { body, validationResult } = require('express-validator');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const { protect, authorize } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Multer storage config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname.replace(/\s+/g, '_'));
  }
});
const upload = multer({ storage });

const router = express.Router();

// @desc    Get all published posts
// @route   GET /api/posts
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, category, author, search, sort = 'latest' } = req.query;
    const skip = (page - 1) * limit;

    let query = {
      status: 'published',
      publishedAt: { $lte: new Date() }
    };

    if (category) {
      query.category = category;
    }

    if (author) {
      query.author = author;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { excerpt: { $regex: search, $options: 'i' } }
      ];
    }

    // Determine sort order
    let sortOrder = {};
    switch (sort) {
      case 'latest':
        sortOrder = { publishedAt: -1 };
        break;
      case 'oldest':
        sortOrder = { publishedAt: 1 };
        break;
      case 'popular':
        sortOrder = { likesCount: -1, views: -1 };
        break;
      case 'views':
        sortOrder = { views: -1 };
        break;
      default:
        sortOrder = { publishedAt: -1 };
    }

    const posts = await Post.find(query)
      .populate('author', 'username firstName lastName avatar')
      .sort(sortOrder)
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Post.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      posts,
      totalPosts: total,
      totalPages,
      currentPage: parseInt(page),
      hasNext: page * limit < total,
      hasPrev: page > 1
    });
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get single post
// @route   GET /api/posts/:id
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'username firstName lastName avatar bio')
      .populate('likes.user', 'username firstName lastName avatar');

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Increment views
    await post.incrementViews();

    // Get comments for the post
    const comments = await Comment.getCommentsForPost(req.params.id, { limit: 20 });

    res.json({
      success: true,
      post,
      comments
    });
  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Create new post
// @route   POST /api/posts
// @access  Private
router.post('/', protect, [
  body('title')
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ max: 200 })
    .withMessage('Title cannot exceed 200 characters'),
  body('content')
    .notEmpty()
    .withMessage('Content is required')
    .isLength({ max: 10000 })
    .withMessage('Content cannot exceed 10000 characters'),
  body('category')
    .isIn(['Entertainment', 'Education', 'Fun', 'Movies', 'Technology', 'Lifestyle', 'Travel', 'Food', 'Sports', 'Other'])
    .withMessage('Invalid category'),
  body('status')
    .optional()
    .isIn(['draft', 'published', 'scheduled'])
    .withMessage('Invalid status'),
  body('scheduledFor')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array() 
      });
    }

    const { title, content, excerpt, category, tags, featuredImage, status, scheduledFor, isPublic, allowComments } = req.body;

    // Validate scheduled post
    if (status === 'scheduled' && !scheduledFor) {
      return res.status(400).json({ message: 'Scheduled date is required for scheduled posts' });
    }

    const post = await Post.create({
      author: req.user._id,
      title,
      content,
      excerpt,
      category,
      tags: tags || [],
      featuredImage,
      status: status || 'draft',
      scheduledFor: scheduledFor ? new Date(scheduledFor) : undefined,
      isPublic: isPublic !== undefined ? isPublic : true,
      allowComments: allowComments !== undefined ? allowComments : true
    });

    const populatedPost = await Post.findById(post._id)
      .populate('author', 'username firstName lastName avatar');

    res.status(201).json({
      success: true,
      message: 'Post created successfully',
      post: populatedPost
    });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ message: 'Server error creating post' });
  }
});

// @desc    Update post
// @route   PUT /api/posts/:id
// @access  Private
router.put('/:id', protect, [
  body('title')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Title cannot exceed 200 characters'),
  body('content')
    .optional()
    .isLength({ max: 10000 })
    .withMessage('Content cannot exceed 10000 characters'),
  body('category')
    .optional()
    .isIn(['Entertainment', 'Education', 'Fun', 'Movies', 'Technology', 'Lifestyle', 'Travel', 'Food', 'Sports', 'Other'])
    .withMessage('Invalid category'),
  body('status')
    .optional()
    .isIn(['draft', 'published', 'scheduled'])
    .withMessage('Invalid status')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array() 
      });
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check authorization
    if (post.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this post' });
    }

    const updateFields = req.body;
    
    // Handle scheduled posts
    if (updateFields.status === 'scheduled' && updateFields.scheduledFor) {
      updateFields.scheduledFor = new Date(updateFields.scheduledFor);
    }

    const updatedPost = await Post.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true, runValidators: true }
    ).populate('author', 'username firstName lastName avatar');

    res.json({
      success: true,
      message: 'Post updated successfully',
      post: updatedPost
    });
  } catch (error) {
    console.error('Update post error:', error);
    res.status(500).json({ message: 'Server error updating post' });
  }
});

// @desc    Delete post
// @route   DELETE /api/posts/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check authorization
    if (post.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this post' });
    }

    // Delete associated comments
    await Comment.deleteMany({ post: req.params.id });

    // Delete the post
    await Post.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Post deleted successfully'
    });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ message: 'Server error deleting post' });
  }
});

// @desc    Like/Unlike post
// @route   POST /api/posts/:id/like
// @access  Private
router.post('/:id/like', protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const isLiked = post.toggleLike(req.user._id);
    await post.save();

    res.json({
      success: true,
      message: isLiked ? 'Post liked' : 'Post unliked',
      isLiked,
      likesCount: post.likesCount
    });
  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Share post
// @route   POST /api/posts/:id/share
// @access  Private
router.post('/:id/share', protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'username firstName lastName avatar');
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // For now, we'll just return the post URL for sharing
    // In a real app, you might want to track shares or integrate with social media
    const shareUrl = `${req.protocol}://${req.get('host')}/posts/${post._id}`;
    
    res.json({
      success: true,
      message: 'Post shared successfully',
      shareUrl,
      post: {
        id: post._id,
        title: post.title,
        excerpt: post.excerpt,
        author: post.author
      }
    });
  } catch (error) {
    console.error('Share post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Upload image
// @route   POST /api/posts/upload-image
// @access  Private
router.post('/upload-image', protect, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }
  const imageUrl = `/uploads/${req.file.filename}`;
  res.status(201).json({ success: true, imageUrl });
});

// @desc    Get user's posts
// @route   GET /api/posts/user/:userId
// @access  Public
router.get('/user/:userId', async (req, res) => {
  try {
    const { page = 1, limit = 10, status = 'published' } = req.query;
    const skip = (page - 1) * limit;

    let query = { author: req.params.userId };

    if (status === 'published') {
      query.status = 'published';
      query.publishedAt = { $lte: new Date() };
    } else if (status === 'draft') {
      query.status = 'draft';
    }

    const posts = await Post.find(query)
      .populate('author', 'username firstName lastName avatar')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Post.countDocuments(query);

    res.json({
      success: true,
      posts,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get user posts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get categories
// @route   GET /api/posts/categories
// @access  Public
router.get('/categories', async (req, res) => {
  try {
    const categories = await Post.aggregate([
      { $match: { status: 'published' } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      categories
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
