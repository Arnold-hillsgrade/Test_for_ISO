import express from 'express';
import { body, validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { authenticateToken } from '../middleware/auth.js';
import querystring from 'querystring';
import axios from 'axios';
import { error, info, warn } from '../utils/logger.js';
import { getBoard, getWorkspace } from '../services/isoplus.js';

const router = express.Router();

router.post('/register',
  [
    body('email').isEmail(),
    body('password').isLength({ min: 6 }),
    body('name').notEmpty()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      warn('User-Service', 'Validation failed during registration', { errors: errors.array() }, req);
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { email, password, name } = req.body;

      const existingUser = await User.findOne({ email });
      if (existingUser) {
        warn('User-Service', 'User already exists', { email }, req);
        return res.status(400).json({ message: 'User already exists' });
      }

      const user = new User({ email, password, name, role: 'support_admin' });
      await user.save();

      const token = jwt.sign(
        { userId: user._id, email: user.email, name: user.name, role: 'support_admin', avatar: '' },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      req.session.token = token;
      await req.session.save();

      info('User-Service', 'User registered successfully', { email }, req);
      res.status(201).json({ user: { id: user._id, email, name, role: 'support_admin', avatar: '' } });
    } catch (err) {
      error('User-Service', 'Server error during registration', { error: err.message }, req);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

router.post('/login',
  [
    body('email').isEmail(),
    body('password').exists()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      warn('User-Service', 'Validation failed during login', { errors: errors.array() }, req);
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email });

      if (!user || !(await user.comparePassword(password))) {
        warn('User-Service', 'Invalid credentials', { email }, req);
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const token = jwt.sign(
        { userId: user._id, email: user.email, name: user.name, role: 'support_admin', avatar: '' },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      req.session.token = token;
      await req.session.save();

      info('User-Service', 'User logged in successfully', { email }, req);
      res.json({ user: { id: user._id, email, name: user.name, role: 'support_admin', avatar: '' } });
    } catch (err) {
      error('User-Service', 'Server error during login', { error: err.message }, req);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      error('Auth-Service', 'Error during logout', { error: err.message }, req);
      return res.status(500).json({ message: 'Logout failed' });
    }
    res.clearCookie('connect.sid');
    res.json({ message: 'Logout successful' });
  });
});

router.get('/verify', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      warn('User-Service', 'User not found during verification', {}, req);
      return res.status(404).json({ message: 'User not found' });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email, name: user.name, role: user.role, avatar: user.avatar, workspace: req.user.workspace, board: req.user.board },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    req.session.token = token;
    await req.session.save();

    res.json({
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar
      }
    });
  } catch (err) {
    error('User-Service', 'Server error during verification', { error: err.message }, req);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get("/isoplus/redirect", (req, res) => {
  const state = Math.random().toString(36).substring(2);

  const query = querystring.stringify({
    client_id: process.env.CLIENT_ID,
    redirect_uri: `${process.env.CALLBACK_URL}`,
    response_type: "code",
    scope: "public-api internal-api",
    state: state,
  });

  res.json({ redirect_uri: `${process.env.AUTHORIZATION_ENDPOINT}?${query}` });
});

router.get("/isoplus/callback", async (req, res) => {
  const { code, state } = req.query;

  if (!code) {
    warn('User-Service', 'Authorization code is missing', { state }, req);
    return res.status(400).json({ error: "Authorization code is missing" });
  }

  try {
    const tokenResponse = await axios.post(`${process.env.TOKEN_ENDPOINT}`, {
      grant_type: "authorization_code",
      client_id: process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SECRET,
      redirect_uri: `${process.env.CALLBACK_URL}`,
      code: code
    }, {
      headers: {
        'Content-Type': 'application/json',
        'X-API-Version': '2025-02-26.morava',
        'Accept': 'application/json'
      }
    });

    if (!tokenResponse.data || !tokenResponse.data.access_token) {
      warn('User-Service', 'Invalid token response', { state, response: tokenResponse.data }, req);
      return res.status(400).json({ error: "Invalid token response" });
    }

    const accessToken = tokenResponse.data.access_token;

    const userResponse = await axios.get(`${process.env.USER_INFORMATION_ENDPOINT}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
        "X-API-Version": "2025-02-26.morava"
      }
    });

    if (!userResponse.data) {
      warn('User-Service', 'Invalid user response', { state }, req);
      return res.status(400).json({ error: "Invalid user response" });
    }

    info('User-Service', 'OAuth callback successful', { state, user: userResponse.data }, req);
    res.send(`
      <html>
        <body>
          <script>
            window.opener.postMessage(${JSON.stringify({
              type: 'AUTH_SUCCESS',
              data: userResponse.data,
              accessToken: `Bearer ${accessToken}`
            })}, '*');
            window.close();
          </script>
        </body>
      </html>
    `);
  } catch (err) {
    error('User-Service', 'Token exchange error', { error: err.message, state, response: err.response?.data, status: err.response?.status }, req);
    const errorMessage = err.response?.data?.error || err.message || 'Failed to authenticate';
    res.send(`
      <html>
        <body>
          <script>
            window.opener.postMessage(${JSON.stringify({
              type: 'AUTH_ERROR',
              error: errorMessage
            })}, '*');
            window.close();
          </script>
        </body>
      </html>
    `);
  }
});

router.post('/oauth-login', async (req, res) => {
  try {
    const { oauthData } = req.body;

    let user = await User.findOne({ email: oauthData.email, oauthId: oauthData.id });
    let role = 'isoplus_user';
    if (!user) {
      user = new User({
        email: oauthData.email,
        name: oauthData.name,
        password: "",
        oauthId: oauthData.id,
        avatar: oauthData.photo_url,
        role: role
      });
      await user.save();
    } else {
      await User.findOneAndUpdate({ email: oauthData.email, oauthId: oauthData.id }, { $set: { avatar: oauthData.photo_url, name: oauthData.name } });
    }

    req.session.Authorization = req.headers['authorization'];
    const workspaceResponse = await getWorkspace(req.session.Authorization, user.email);

    if (workspaceResponse.status === 200) {
      role = workspaceResponse.workspace[0]?.user_role || "isoplus_user";
      if (role === "owner" && user.role !== "owner") {
        await User.findByIdAndUpdate({ _id: user._id }, { $set: { role: "owner" } });
      }

      const workspace = workspaceResponse.workspace.map(w => {
        const board = w.board.map(b => {
          return b.id
        });
        return {
          id: w.id,
          board: board,
          user_role: w.user_role
        }
      });

      const token = jwt.sign(
        { userId: user._id, email: user.email, name: user.name, role: user.role, avatar: user.avatar, workspace: workspace },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      req.session.token = token;
      await req.session.save();      
      info('User-Service', 'OAuth login successful', { email: user.email }, req);
      res.json({
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          avatar: user.avatar,
          role: user.role
        }
      });
    }    
  } catch (err) {
    error('User-Service', 'Server error during OAuth login', { error: err.message }, req);
    res.status(500).json({ message: 'Server error during OAuth login' });
  }
});

export default router;