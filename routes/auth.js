const express = require('express');
const admin = require('firebase-admin');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

// Firebase Admin is initialized in server.js during app startup

// Middleware to verify Firebase token
const verifyFirebaseToken = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        // Verify Firebase token
        const decodedToken = await admin.auth().verifyIdToken(token);
        req.user = decodedToken;
        next();
    } catch (error) {
        console.error('Token verification error:', error);
        res.status(401).json({ error: 'Invalid token' });
    }
};

// Register/Login with Firebase
router.post('/firebase-auth', async (req, res) => {
    try {
        const { firebaseToken, userData } = req.body;
        
        // Skip Firebase token verification if using demo credentials
        if (process.env.FIREBASE_PROJECT_ID === 'demo-project') {
            return res.status(400).json({ 
                error: 'Firebase not configured. Please add real Firebase credentials to enable authentication.' 
            });
        }
        
        // Verify Firebase token
        const decodedToken = await admin.auth().verifyIdToken(firebaseToken);
        const { uid, email, name, picture } = decodedToken;

        // Check if user exists in our database
        let user = await User.findOne({ firebaseUid: uid });
        
        if (!user) {
            // Create new user
            user = new User({
                firebaseUid: uid,
                email: email,
                name: name || userData.name,
                profilePicture: picture || userData.profilePicture,
                travelPreferences: userData.travelPreferences || {},
                createdAt: new Date()
            });
            await user.save();
        } else {
            // Update existing user
            user.lastLogin = new Date();
            if (userData.travelPreferences) {
                user.travelPreferences = { ...user.travelPreferences, ...userData.travelPreferences };
            }
            await user.save();
        }

        // Generate our own JWT for API access
        const jwtToken = jwt.sign(
            { userId: user._id, firebaseUid: uid },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            token: jwtToken,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                profilePicture: user.profilePicture,
                travelPreferences: user.travelPreferences
            }
        });

    } catch (error) {
        console.error('Firebase auth error:', error);
        res.status(400).json({ error: 'Authentication failed' });
    }
});

// Get current user profile
router.get('/profile', verifyFirebaseToken, async (req, res) => {
    try {
        const user = await User.findOne({ firebaseUid: req.user.uid });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            id: user._id,
            name: user.name,
            email: user.email,
            profilePicture: user.profilePicture,
            travelPreferences: user.travelPreferences,
            bio: user.bio,
            location: user.location,
            memberSince: user.createdAt
        });
    } catch (error) {
        console.error('Profile fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});

// Update user profile
router.put('/profile', verifyFirebaseToken, async (req, res) => {
    try {
        const updates = req.body;
        const user = await User.findOneAndUpdate(
            { firebaseUid: req.user.uid },
            { ...updates, updatedAt: new Date() },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                profilePicture: user.profilePicture,
                travelPreferences: user.travelPreferences,
                bio: user.bio,
                location: user.location
            }
        });
    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

// Logout (mainly for cleanup)
router.post('/logout', (req, res) => {
    res.json({ success: true, message: 'Logged out successfully' });
});

module.exports = router;
