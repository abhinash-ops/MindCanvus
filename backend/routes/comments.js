const express = require('express');
const { body, validationResult } = require('express-validator');
const Comment = require('../models/Comment');
const Post = require('../models/Post');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @desc    Get comments for a post
// @route   GET /api/comments/post/:postId
// @access  Public
router.get('/post/:postId', async (req, res) => {
  try {
    const { page = 1, limit = 20, sort = 'newest' } = req.query;
    const skip = (page - 1) * limit;

    const comments = await Comment.getCommentsForPost(req.params.postId, {
      limit: parseInt(limit),
      skip,
      sort
    });

    const total = await Comment.countDocuments({
      post: req.params.postId,
      parentComment: null,
      isDeleted: false
    });

    res.json({
      success: true,
      comments,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Add comment to post
// @route   POST /api/comments
// @access  Private
router.post('/', protect, [
  body('post')
    .notEmpty()
    .withMessage('Post ID is required'),
  body('content')
    .notEmpty()
    .withMessage('Comment content is required')
    .isLength({ max: 1000 })
    .withMessage('Comment cannot exceed 1000 characters'),
  body('parentComment')
    .optional()
    .isMongoId()
    .withMessage('Invalid parent comment ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array() 
      });
    }

    const { post, content, parentComment } = req.body;

    // Check if post exists and allows comments
    const postDoc = await Post.findById(post);
    if (!postDoc) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (!postDoc.allowComments) {
      return res.status(400).json({ message: 'Comments are disabled for this post' });
    }

    // If this is a reply, check if parent comment exists
    if (parentComment) {
      const parentCommentDoc = await Comment.findById(parentComment);
      if (!parentCommentDoc) {
        return res.status(404).json({ message: 'Parent comment not found' });
      }
    }

    const comment = await Comment.create({
      post,
      author: req.user._id,
      content,
      parentComment: parentComment || null
    });

    // If this is a reply, add it to parent comment's replies
    if (parentComment) {
      await Comment.findByIdAndUpdate(parentComment, {
        $push: { replies: comment._id }
      });
    }

    const populatedComment = await Comment.findById(comment._id)
      .populate('author', 'username firstName lastName avatar');

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      comment: populatedComment
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ message: 'Server error adding comment' });
  }
});

// @desc    Update comment
// @route   PUT /api/comments/:id
// @access  Private
router.put('/:id', protect, [
  body('content')
    .notEmpty()
    .withMessage('Comment content is required')
    .isLength({ max: 1000 })
    .withMessage('Comment cannot exceed 1000 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array() 
      });
    }

    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check if user owns the comment
    if (comment.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this comment' });
    }

    comment.content = req.body.content;
    await comment.markAsEdited();
    await comment.save();

    const updatedComment = await Comment.findById(comment._id)
      .populate('author', 'username firstName lastName avatar');

    res.json({
      success: true,
      message: 'Comment updated successfully',
      comment: updatedComment
    });
  } catch (error) {
    console.error('Update comment error:', error);
    res.status(500).json({ message: 'Server error updating comment' });
  }
});

// @desc    Delete comment
// @route   DELETE /api/comments/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check if user owns the comment or is admin
    if (comment.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this comment' });
    }

    // Soft delete the comment
    await comment.softDelete();

    res.json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ message: 'Server error deleting comment' });
  }
});

// @desc    Like/Unlike comment
// @route   POST /api/comments/:id/like
// @access  Private
router.post('/:id/like', protect, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    const isLiked = comment.toggleLike(req.user._id);
    await comment.save();

    res.json({
      success: true,
      message: isLiked ? 'Comment liked' : 'Comment unliked',
      isLiked,
      likesCount: comment.likesCount
    });
  } catch (error) {
    console.error('Like comment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get replies for a comment
// @route   GET /api/comments/:id/replies
// @access  Public
router.get('/:id/replies', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const replies = await Comment.getRepliesForComment(req.params.id, {
      limit: parseInt(limit),
      skip
    });

    const total = await Comment.countDocuments({
      parentComment: req.params.id,
      isDeleted: false
    });

    res.json({
      success: true,
      replies,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get replies error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
