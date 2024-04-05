import mongoose, { Schema } from 'mongoose';
import { User } from './user.model';

const retweetSchema = new Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
});

const likeSchema = new Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
});

const commentSchema = new Schema(
  {
    content: {
      type: String,
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

const tweetSchema = new Schema(
  {
    content: {
      type: String,
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    retweet: {
      type: [retweetSchema]
    },
    like: {
      type: [likeSchema]
    },
    comment: {
      type: [commentSchema]
    }
  },
  { timestamps: true }
);

export const Tweet = mongoose.model('Tweet', tweetSchema);