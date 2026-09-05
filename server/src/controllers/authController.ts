import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/auth/register
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body as {
      name?: string;
      email?: string;
      password?: string;
    };

    // Validate required fields
    if (!name || !email || !password) {
      res.status(400).json({ message: 'Name, email, and password are required' });
      return;
    }

    // Validate email format
    if (!EMAIL_REGEX.test(email)) {
      res.status(400).json({ message: 'Invalid email format' });
      return;
    }

    // Validate password length
    if (password.length < 6) {
      res.status(400).json({ message: 'Password must be at least 6 characters' });
      return;
    }

    // Reject duplicate email
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      res.status(409).json({ message: 'Email is already registered' });
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create and save user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// POST /api/auth/login
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body as {
      email?: string;
      password?: string;
    };

    // Validate required fields
    if (!email || !password) {
      res.status(400).json({ message: 'Email and password are required' });
      return;
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    // Read JWT secret from environment
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      res.status(500).json({ message: 'Server configuration error' });
      return;
    }

    // Sign JWT
    const token = jwt.sign({ id: user._id }, jwtSecret, { expiresIn: '7d' });

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error during login' });
  }
};
