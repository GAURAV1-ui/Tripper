const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const blogSchema = new Schema(
  {
    title: {
      type: String,
    },
    content: {
      type: String,
    },
    blogTag: [
      {
        type: String,
      },
    ],
    blogViews: {
      type: Number,
      default: 0,
    },
    blogImage: {
      type: String,
    },
    likes: {
      type: Number,
      default: 0,
    },
    dislikes: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      default: "pending",
    },
    comments: [
      {
        type: Schema.Types.ObjectId,
        ref: "Comment",
      },
    ],
    author: {
      type: Schema.Types.ObjectId,
      ref: "Guide",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Blog", blogSchema);
