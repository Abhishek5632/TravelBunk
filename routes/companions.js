const express = require('express');
const User = require('../models/User');
const requireAuth = require('../middleware/requireAuth');
const router = express.Router();

// Find compatible travel companions
router.get('/find', async (req, res) => {
    try {
        const { 
            destination, 
            budgetMin, 
            budgetMax, 
            travelStyle, 
            startDate, 
            endDate,
            userId 
        } = req.query;

        let matchQuery = { 
            isActive: true,
            _id: { $ne: userId } // Exclude the requesting user
        };

        // Budget compatibility
        if (budgetMin && budgetMax) {
            matchQuery.$and = [
                { 'travelPreferences.budgetRange.min': { $lte: parseInt(budgetMax) } },
                { 'travelPreferences.budgetRange.max': { $gte: parseInt(budgetMin) } }
            ];
        }

        // Travel style compatibility
        if (travelStyle) {
            matchQuery['travelPreferences.travelStyle'] = { $in: [travelStyle] };
        }

        const companions = await User.find(matchQuery)
            .select('name profilePicture bio location travelPreferences stats')
            .sort({ 'stats.rating': -1 })
            .limit(20);

        // Calculate compatibility score for each companion
        const companionsWithScore = companions.map(companion => {
            let score = 0;
            
            // Budget compatibility (30% weight)
            const userBudgetMin = parseInt(budgetMin) || 0;
            const userBudgetMax = parseInt(budgetMax) || 100000;
            const compBudgetMin = companion.travelPreferences.budgetRange.min;
            const compBudgetMax = companion.travelPreferences.budgetRange.max;
            
            const budgetOverlap = Math.min(userBudgetMax, compBudgetMax) - Math.max(userBudgetMin, compBudgetMin);
            if (budgetOverlap > 0) score += 30;

            // Travel style compatibility (40% weight)
            if (travelStyle && companion.travelPreferences.travelStyle.includes(travelStyle)) {
                score += 40;
            }

            // Rating bonus (20% weight)
            score += (companion.stats.rating / 5) * 20;

            // Experience bonus (10% weight)
            score += Math.min(companion.stats.tripsCompleted / 10, 1) * 10;

            return {
                ...companion.toObject(),
                compatibilityScore: Math.round(score)
            };
        });

        // Sort by compatibility score
        companionsWithScore.sort((a, b) => b.compatibilityScore - a.compatibilityScore);

        res.json({
            companions: companionsWithScore,
            total: companionsWithScore.length
        });

    } catch (error) {
        console.error('Companion search error:', error);
        res.status(500).json({ error: 'Failed to find companions' });
    }
});

// Get featured/popular companions
router.get('/featured', async (req, res) => {
    try {
        const featuredCompanions = await User.find({ 
            isActive: true,
            'stats.rating': { $gte: 4.0 },
            'stats.tripsCompleted': { $gte: 3 }
        })
        .select('name profilePicture bio location travelPreferences stats')
        .sort({ 'stats.rating': -1, 'stats.tripsCompleted': -1 })
        .limit(12);

        res.json(featuredCompanions);
    } catch (error) {
        console.error('Featured companions error:', error);
        res.status(500).json({ error: 'Failed to fetch featured companions' });
    }
});

// Send companion request (placeholder - would integrate with messaging system)
router.post('/request', requireAuth, async (req, res) => {
    try {
        const { companionId, message, tripDetails } = req.body;
        
        // In a real app, this would create a companion request record
        // and send a notification to the target user
        
        res.json({
            success: true,
            message: 'Companion request sent successfully!',
            requestId: Date.now() // Placeholder ID
        });
    } catch (error) {
        console.error('Companion request error:', error);
        res.status(500).json({ error: 'Failed to send companion request' });
    }
});

module.exports = router;
