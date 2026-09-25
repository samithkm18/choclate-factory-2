import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { authenticate, loginRateLimiter } from '../middleware/auth.js';

const router = express.Router();

// Read JWT_SECRET lazily so dotenv is guaranteed to have loaded
const getJwtSecret = () => process.env.JWT_SECRET || 'manis_luxury_chocolate_secret_key_2026_rfv_tgb';

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'All fields (name, email, password) are required.' });
  }

  try {
    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'An account with this email already exists.' });
    }

    // Hash password and insert
    const passwordHash = await bcrypt.hash(password, 10);
    const user = new User({
      name,
      email,
      password_hash: passwordHash,
      role: 'user',
      status: 'active'
    });
    await user.save();

    // Create JWT
    const token = jwt.sign(
      { id: user._id.toString(), name, email, role: 'user' },
      getJwtSecret(),
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      message: 'Account created successfully.',
      token,
      user: { id: user._id.toString(), name, email, role: 'user' }
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ message: 'Internal server error during registration.' });
  }
});

// POST /api/auth/login
router.post('/login', loginRateLimiter, async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    const cleanEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    if (user.status === 'disabled') {
      return res.status(403).json({ message: 'Your account has been disabled. Contact support.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    // Create JWT token
    const token = jwt.sign(
      { id: user._id.toString(), name: user.name, email: user.email, role: user.role },
      getJwtSecret(),
      { expiresIn: '7d' }
    );

    return res.json({
      message: 'Login successful.',
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Internal server error during login.' });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, (req, res) => {
  return res.json({ user: req.user });
});

// GET /api/auth/google - Trigger Google OAuth flow
router.get('/google', (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const callbackUrl = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback';

  // Fall back to mock sandbox if real credentials not configured
  if (!clientId) {
    console.warn('[OAuth] GOOGLE_CLIENT_ID not set — redirecting to mock sandbox');
    return res.redirect('/api/auth/google/mock-login');
  }

  const authUrl = 'https://accounts.google.com/o/oauth2/v2/auth?' +
    `client_id=${encodeURIComponent(clientId)}&` +
    `redirect_uri=${encodeURIComponent(callbackUrl)}&` +
    `response_type=code&` +
    `scope=${encodeURIComponent('openid profile email')}&` +
    `access_type=offline&` +
    `prompt=consent`;

  console.log('[OAuth] Redirecting to Google:', authUrl);
  return res.redirect(authUrl);
});

// GET /api/auth/google/mock-login - serves HTML Mock sign-in screen
router.get('/google/mock-login', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Mani's Chocolate Google OAuth Sandbox</title>
        <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght=700&family=Inter:wght=400;600&display=swap" rel="stylesheet">
        <style>
          body {
            background-color: #0A0A0A;
            color: #E2E8F0;
            font-family: 'Inter', sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
          }
          .card {
            background-color: #121212;
            border: 1px solid #C9A84C;
            border-radius: 20px;
            padding: 40px;
            text-align: center;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
            max-width: 400px;
            width: 100%;
          }
          h1 {
            font-family: 'Cinzel', serif;
            color: #C9A84C;
            font-size: 24px;
            margin-bottom: 20px;
            letter-spacing: 0.1em;
          }
          p {
            font-size: 12px;
            color: #A0AEC0;
            margin-bottom: 30px;
          }
          input {
            width: 100%;
            background-color: #1A1A1A;
            border: 1px solid #333;
            border-radius: 8px;
            padding: 10px 15px;
            color: white;
            font-size: 13px;
            box-sizing: border-box;
            margin-bottom: 15px;
          }
          input:focus {
            border-color: #C9A84C;
            outline: none;
          }
          button {
            width: 100%;
            background-color: #C9A84C;
            color: #1A0D0E;
            font-weight: bold;
            padding: 12px;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            text-transform: uppercase;
            font-size: 11px;
            letter-spacing: 0.1em;
            transition: background 0.3s;
          }
          button:hover {
            background-color: #DFBF65;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>Google Sandbox Sign-In</h1>
          <p>Local sandbox emulation node. Enter credentials to simulate authenticated Google OAuth login.</p>
          <form action="/api/auth/google/callback" method="GET">
            <input type="hidden" name="is_mock" value="true" />
            <input type="text" name="name" required placeholder="User Name" value="Audrey Hepburn" />
            <input type="email" name="email" required placeholder="Email Address" value="user@manis.com" />
            <input type="text" name="picture" placeholder="Avatar URL" value="https://lh3.googleusercontent.com/a/default-user" />
            <button type="submit">Verify Google Identity</button>
          </form>
        </div>
      </body>
    </html>
  `);
});

// GET /api/auth/google/callback - Google OAuth callback url
router.get('/google/callback', async (req, res) => {
  const { code, is_mock, name, email, picture } = req.query;

  let googleId = '';
  let profileEmail = '';
  let profileName = '';
  let profilePic = '';

  if (is_mock === 'true') {
    googleId = 'mock_google_id_' + email;
    profileEmail = email;
    profileName = name;
    profilePic = picture;
  } else {
    if (!code) {
      return res.redirect((process.env.FRONTEND_URL || 'http://localhost:5173') + '/login?error=no_auth_code');
    }

    try {
      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code: code,
          client_id: process.env.GOOGLE_CLIENT_ID,
          client_secret: process.env.GOOGLE_CLIENT_SECRET,
          redirect_uri: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback',
          grant_type: 'authorization_code'
        })
      });

      if (!tokenRes.ok) {
        throw new Error('Failed to exchange code for token');
      }

      const tokenData = await tokenRes.json();
      const access_token = tokenData.access_token;

      // Fetch user profile
      const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { 'Authorization': `Bearer ${access_token}` }
      });

      if (!userRes.ok) {
        throw new Error('Failed to load user profile');
      }

      const userData = await userRes.json();
      googleId = userData.sub;
      profileEmail = userData.email;
      profileName = userData.name;
      profilePic = userData.picture;
    } catch (err) {
      console.error('Google OAuth exchange error:', err);
      return res.redirect((process.env.FRONTEND_URL || 'http://localhost:5173') + '/login?error=oauth_failed');
    }
  }

  // Handle MongoDB user record find or create
  try {
    let user = await User.findOne({ $or: [{ google_id: googleId }, { email: profileEmail }] });
    
    if (user) {
      // User exists - update profile details if missing
      user.google_id = googleId;
      if (profilePic) user.profile_image = profilePic;
      await user.save();
    } else {
      // Create user
      const mockPassHash = 'google_oauth_no_password_set_' + Math.random().toString(36).substring(2, 10);
      user = new User({
        name: profileName,
        email: profileEmail,
        password_hash: mockPassHash,
        google_id: googleId,
        profile_image: profilePic,
        role: 'user',
        status: 'active'
      });
      await user.save();
    }

    if (user.status === 'disabled') {
      return res.redirect((process.env.FRONTEND_URL || 'http://localhost:5173') + '/login?error=account_disabled');
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user._id.toString(), name: user.name, email: user.email, role: user.role },
      getJwtSecret(),
      { expiresIn: '7d' }
    );

    // Redirect to frontend /login-success with token in query params
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const redirectUrl = `${frontendUrl}/login-success?token=${encodeURIComponent(token)}&name=${encodeURIComponent(user.name)}&email=${encodeURIComponent(user.email)}`;
    console.log('[OAuth] Login complete, redirecting to frontend:', redirectUrl);
    return res.redirect(redirectUrl);

  } catch (err) {
    console.error('Error in Google OAuth callback database save:', err);
    return res.redirect((process.env.FRONTEND_URL || 'http://localhost:5173') + '/login?error=database_error');
  }
});

export default router;
