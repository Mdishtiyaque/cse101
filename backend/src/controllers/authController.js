const User = require('../models/User');
const { generateToken } = require('../middleware/auth');

class AuthController {
  // Register new user
  static async register(req, res) {
    try {
      const { email, password } = req.body;

      // Check if user already exists
      const existingUser = await User.emailExists(email);
      if (existingUser) {
        return res.status(409).json({
          error: 'User already exists',
          message: 'An account with this email address already exists'
        });
      }

      // Create new user
      const user = await User.create({ email, password });
      
      // Generate JWT token
      const token = generateToken(user.id);

      res.status(201).json({
        message: 'User registered successfully',
        user: {
          id: user.id,
          email: user.email,
          createdAt: user.created_at
        },
        token
      });

    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        error: 'Registration failed',
        message: 'An error occurred during registration'
      });
    }
  }

  // Login user
  static async login(req, res) {
    try {
      const { email, password } = req.body;

      // Find user by email
      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(401).json({
          error: 'Invalid credentials',
          message: 'Email or password is incorrect'
        });
      }

      // Verify password
      const isValidPassword = await User.verifyPassword(password, user.password_hash);
      if (!isValidPassword) {
        return res.status(401).json({
          error: 'Invalid credentials',
          message: 'Email or password is incorrect'
        });
      }

      // Generate JWT token
      const token = generateToken(user.id);

      res.json({
        message: 'Login successful',
        user: {
          id: user.id,
          email: user.email,
          createdAt: user.created_at
        },
        token
      });

    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        error: 'Login failed',
        message: 'An error occurred during login'
      });
    }
  }

  // Get current user profile
  static async getProfile(req, res) {
    try {
      const user = req.user; // Set by authenticateToken middleware

      res.json({
        user: {
          id: user.id,
          email: user.email,
          createdAt: user.created_at
        }
      });

    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        error: 'Profile fetch failed',
        message: 'An error occurred while fetching profile'
      });
    }
  }

  // Logout (client-side token removal, but we can add token blacklisting later)
  static async logout(req, res) {
    try {
      // For JWT, logout is typically handled client-side by removing the token
      // In a production app, you might want to implement token blacklisting
      
      res.json({
        message: 'Logout successful',
        instruction: 'Please remove the token from client storage'
      });

    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        error: 'Logout failed',
        message: 'An error occurred during logout'
      });
    }
  }

  // Update password
  static async updatePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user.id;

      // Get user with password hash
      const user = await User.findByEmail(req.user.email);
      
      // Verify current password
      const isValidPassword = await User.verifyPassword(currentPassword, user.password_hash);
      if (!isValidPassword) {
        return res.status(401).json({
          error: 'Invalid current password',
          message: 'The current password you entered is incorrect'
        });
      }

      // Update password
      const updatedUser = await User.updatePassword(userId, newPassword);

      res.json({
        message: 'Password updated successfully',
        user: {
          id: updatedUser.id,
          email: updatedUser.email
        }
      });

    } catch (error) {
      console.error('Update password error:', error);
      res.status(500).json({
        error: 'Password update failed',
        message: 'An error occurred while updating password'
      });
    }
  }

  // Delete account
  static async deleteAccount(req, res) {
    try {
      const { password } = req.body;
      const userId = req.user.id;

      // Get user with password hash
      const user = await User.findByEmail(req.user.email);
      
      // Verify password before deletion
      const isValidPassword = await User.verifyPassword(password, user.password_hash);
      if (!isValidPassword) {
        return res.status(401).json({
          error: 'Invalid password',
          message: 'Password verification failed'
        });
      }

      // Delete user (this will cascade delete all tasks due to foreign key constraints)
      await User.deleteUser(userId);

      res.json({
        message: 'Account deleted successfully'
      });

    } catch (error) {
      console.error('Delete account error:', error);
      res.status(500).json({
        error: 'Account deletion failed',
        message: 'An error occurred while deleting account'
      });
    }
  }
}

module.exports = AuthController;