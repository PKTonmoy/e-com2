/**
 * Google OAuth2 Authentication Routes
 * 
 * Security features:
 * - State parameter for CSRF protection
 * - Server-side ID token verification
 * - Secure session via existing JWT system
 */

import express from 'express';
import { OAuth2Client } from 'google-auth-library';
import User from '../models/User.js';
import { signToken } from '../utils/jwt.js';

const router = express.Router();

// In-memory state store (use Redis in production for scalability)
const stateStore = new Map();

/**
 * Generate a random state parameter for CSRF protection
 */
function generateState() {
    return Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15);
}

/**
 * Get OAuth2 client (lazy initialization after env vars are loaded)
 */
function getOAuth2Client() {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/auth/google/callback';

    if (!clientId || !clientSecret) {
        return null;
    }

    return new OAuth2Client(clientId, clientSecret, redirectUri);
}

/**
 * GET /api/auth/google
 * Initiates Google OAuth flow by redirecting to Google's consent screen
 */
router.get('/google', (req, res) => {
    const oauth2Client = getOAuth2Client();

    if (!oauth2Client) {
        console.error('[GoogleAuth] Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET');
        return res.status(500).json({ message: 'Google OAuth not configured' });
    }

    // Generate state for CSRF protection
    const state = generateState();

    // Store state with timestamp (expires in 10 minutes)
    stateStore.set(state, {
        createdAt: Date.now(),
        redirectTo: req.query.redirect || '/'
    });

    // Clean up expired states (older than 10 minutes)
    const TEN_MINUTES = 10 * 60 * 1000;
    for (const [key, value] of stateStore.entries()) {
        if (Date.now() - value.createdAt > TEN_MINUTES) {
            stateStore.delete(key);
        }
    }

    // Generate authorization URL
    const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: ['openid', 'profile', 'email'],
        state: state,
        prompt: 'consent',
    });

    res.redirect(authUrl);
});

/**
 * GET /api/auth/google/callback
 * Handles the OAuth callback from Google
 */
router.get('/google/callback', async (req, res) => {
    const FRONTEND_URL = process.env.CLIENT_URL || 'http://localhost:5173';
    const { code, state, error } = req.query;

    // Handle user declining consent
    if (error) {
        console.error('[GoogleAuth] User denied consent:', error);
        return res.redirect(`${FRONTEND_URL}/login?error=consent_denied`);
    }

    // Verify state parameter (CSRF protection)
    if (!state || !stateStore.has(state)) {
        console.error('[GoogleAuth] Invalid state parameter');
        return res.redirect(`${FRONTEND_URL}/login?error=invalid_state`);
    }

    const stateData = stateStore.get(state);
    stateStore.delete(state); // State can only be used once

    // Check state expiry
    const TEN_MINUTES = 10 * 60 * 1000;
    if (Date.now() - stateData.createdAt > TEN_MINUTES) {
        console.error('[GoogleAuth] State expired');
        return res.redirect(`${FRONTEND_URL}/login?error=state_expired`);
    }

    if (!code) {
        return res.redirect(`${FRONTEND_URL}/login?error=no_code`);
    }

    try {
        const oauth2Client = getOAuth2Client();
        if (!oauth2Client) {
            throw new Error('OAuth client not configured');
        }

        // Exchange authorization code for tokens
        const { tokens } = await oauth2Client.getToken(code);

        // Verify ID token using Google's public keys
        const ticket = await oauth2Client.verifyIdToken({
            idToken: tokens.id_token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();

        // Extract user info from verified token
        const { sub: googleId, email, name, picture } = payload;

        console.log(`[GoogleAuth] Verified user: ${email}`);

        // Find or create user
        let user = await User.findOne({
            $or: [{ googleId }, { email: email.toLowerCase() }]
        });

        if (user) {
            // Existing user - update Google info if not already linked
            if (!user.googleId) {
                user.googleId = googleId;
                user.provider = 'google';
            }
            user.avatarUrl = picture;
            user.lastLogin = new Date();
            await user.save();
            console.log(`[GoogleAuth] Updated existing user: ${user.email}`);
        } else {
            // New user - create account
            user = await User.create({
                name,
                email: email.toLowerCase(),
                googleId,
                provider: 'google',
                avatarUrl: picture,
                lastLogin: new Date(),
            });
            console.log(`[GoogleAuth] Created new user: ${user.email}`);
        }

        // Generate JWT token (using existing system)
        const token = signToken(user);

        // Redirect to frontend with token
        res.redirect(`${FRONTEND_URL}/auth/google/callback?token=${token}`);

    } catch (err) {
        console.error('[GoogleAuth] Token verification failed:', err.message);
        return res.redirect(`${FRONTEND_URL}/login?error=verification_failed`);
    }
});

export default router;
