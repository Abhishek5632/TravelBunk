const express = require('express');
const User = require('../models/User');
const router = express.Router();

// Safely escape user-provided strings for use in RegExp
function escapeRegExp(str = '') {
    return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Get all users (for admin or testing)
router.get('/', async (req, res) => {
    try {
        const users = await User.find({ isActive: true })
            .select('-firebaseUid -email')
            .limit(50);
        res.json(users);
    } catch (error) {
        console.error('Users fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// Search users by location or preferences
router.get('/search', async (req, res) => {
    try {
        const { city, country, travelStyle, budgetMin, budgetMax } = req.query;
        // Clamp pagination to prevent abuse
        let page = parseInt(req.query.page || '1', 10);
        let limit = parseInt(req.query.limit || '20', 10);
        page = Number.isFinite(page) && page > 0 ? Math.min(page, 1000) : 1;
        limit = Number.isFinite(limit) && limit > 0 ? Math.min(limit, 50) : 20; 

        let query = { isActive: true };
        
        // Location filter (escaped regex)
        if (city) query['location.city'] = new RegExp(escapeRegExp(city), 'i');
        if (country) query['location.country'] = new RegExp(escapeRegExp(country), 'i');
        
        // Travel style filter
        if (travelStyle) {
            query['travelPreferences.travelStyle'] = { $in: [travelStyle] };
        }
        
        // Budget filter
        if (budgetMin || budgetMax) {
            query['travelPreferences.budgetRange.min'] = {};
            query['travelPreferences.budgetRange.max'] = {};
            
            if (budgetMin) {
                query['travelPreferences.budgetRange.max'] = { $gte: parseInt(budgetMin) };
            }
            if (budgetMax) {
                query['travelPreferences.budgetRange.min'] = { $lte: parseInt(budgetMax) };
            }
        }

        const users = await User.find(query)
            .select('name profilePicture bio location travelPreferences stats')
            .skip((page - 1) * limit)
            .limit(limit)
            .sort({ 'stats.rating': -1, createdAt: -1 });

        const total = await User.countDocuments(query);

        res.json({
            users,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('User search error:', error);
        res.status(500).json({ error: 'Search failed' });
    }
});

// Get user by ID
router.get('/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .select('name profilePicture bio location travelPreferences stats socialLinks');
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        console.error('User fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});

module.exports = router;
