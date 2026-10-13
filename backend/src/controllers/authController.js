const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

function createToken(user) {
  const secret = process.env.JWT_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET must be configured with at least 32 characters');
  }

  return jwt.sign(
    {
      sub: user._id.toString(),
      role: user.role
    },
    secret,
    { expiresIn: '1h', issuer: 'ocean-hazard-platform' }
  );
}

function publicUser(user) {
  return {
    id: user.customId || user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role
  };
}

async function register(req, res, next) {
  try {
    const { name, email, password } = req.body || {};

    if (
      typeof name !== 'string' ||
      !name.trim() ||
      typeof email !== 'string' ||
      !/^\S+@\S+\.\S+$/.test(email.trim()) ||
      typeof password !== 'string' ||
      password.length < 8 ||
      password.length > 72
    ) {
      return res.status(400).json({
        success: false,
        message: 'Provide a name, valid email, and password of 8–72 characters'
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists'
      });
    }

    const user = await User.create({
      customId: `USR-${crypto.randomUUID()}`,
      name: name.trim(),
      email: normalizedEmail,
      password,
      role: 'citizen'
    });

    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        user: publicUser(user),
        token: createToken(user)
      }
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists'
      });
    }
    next(error);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body || {};

    if (
      typeof email !== 'string' ||
      typeof password !== 'string' ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase()
    }).select('+password');

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: publicUser(user),
        token: createToken(user)
      }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { register, login };
