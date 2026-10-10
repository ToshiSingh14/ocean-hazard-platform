const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    // Minimal custom user ID (e.g. "USR-014")
    customId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      index: true
    },

    // User display name
    name: {
      type: String,
      required: [true, 'User name is required'],
      trim: true
    },

    // Optional email
    email: {
      type: String,
      trim: true,
      lowercase: true,
      sparse: true
    },

    // Role for demo and authorization ('citizen' or 'admin')
    role: {
      type: String,
      enum: {
        values: ['citizen', 'admin'],
        message: '{VALUE} is not a valid role. Allowed roles are: citizen, admin'
      },
      default: 'citizen',
      required: true
    }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret.customId || ret._id.toString();
        return ret;
      }
    },
    toObject: {
      virtuals: true
    }
  }
);

userSchema.index({ role: 1 });

const User = mongoose.model('User', userSchema);

module.exports = User;
