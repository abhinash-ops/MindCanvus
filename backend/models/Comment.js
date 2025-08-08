const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: [true, 'Comment content is required'],
    maxlength: [1000, 'Comment cannot exceed 1000 characters']
  },
  parentComment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
    default: null
  },
  replies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  }],
  likes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: {
    type: Date
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for better query performance
commentSchema.index({ post: 1, createdAt: -1 });
commentSchema.index({ author: 1, createdAt: -1 });
commentSchema.index({ parentComment: 1 });

// Virtual for likes count
commentSchema.virtual('likesCount').get(function() {
  return this.likes.length;
});

// Virtual for replies count
commentSchema.virtual('repliesCount').get(function() {
  return this.replies.length;
});

// Method to check if user has liked the comment
commentSchema.methods.isLikedBy = function(userId) {
  return this.likes.some(like => like.user.toString() === userId.toString());
};

// Method to toggle like
commentSchema.methods.toggleLike = function(userId) {
  const likeIndex = this.likes.findIndex(like => like.user.toString() === userId.toString());
  
  if (likeIndex > -1) {
    this.likes.splice(likeIndex, 1);
    return false; // unliked
  } else {
    this.likes.push({ user: userId });
    return true; // liked
  }
};

// Method to soft delete comment
commentSchema.methods.softDelete = function() {
  this.isDeleted = true;
  this.content = '[Comment deleted]';
  return this.save();
};

// Method to mark as edited
commentSchema.methods.markAsEdited = function() {
  this.isEdited = true;
  this.editedAt = new Date();
  return this.save();
};

// Static method to get comments for a post
commentSchema.statics.getCommentsForPost = function(postId, options = {}) {
  const query = {
    post: postId,
    parentComment: null, // Only top-level comments
    isDeleted: false
  };
  
  return this.find(query)
    .populate('author', 'username firstName lastName avatar')
    .populate({
      path: 'replies',
      match: { isDeleted: false },
      populate: {
        path: 'author',
        select: 'username firstName lastName avatar'
      }
    })
    .sort({ createdAt: options.sort === 'oldest' ? 1 : -1 })
    .limit(options.limit || 10)
    .skip(options.skip || 0);
};

// Static method to get replies for a comment
commentSchema.statics.getRepliesForComment = function(commentId, options = {}) {
  return this.find({
    parentComment: commentId,
    isDeleted: false
  })
    .populate('author', 'username firstName lastName avatar')
    .sort({ createdAt: 1 })
    .limit(options.limit || 10)
    .skip(options.skip || 0);
};

module.exports = mongoose.model('Comment', commentSchema);
