const express = require('express');
const mongoose = require('mongoose');
const requireAuth = require('../middleware/requireAuth');
const router = express.Router();

// Trip Room Schema (inline for now)
const tripRoomSchema = new mongoose.Schema({
    title: { type: String, required: true },
    destination: { type: String, required: true },
    description: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    budget: {
        min: { type: Number, required: true },
        max: { type: Number, required: true }
    },
    maxParticipants: { type: Number, default: 10 },
    currentParticipants: { type: Number, default: 1 },
    creator: {
        id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        name: String,
        profilePicture: String
    },
    participants: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        name: String,
        profilePicture: String,
        joinedAt: { type: Date, default: Date.now }
    }],
    tags: [String],
    travelStyle: [String],
    accommodationType: String,
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const TripRoom = mongoose.model('TripRoom', tripRoomSchema);

// Get all active trip rooms
router.get('/', async (req, res) => {
    try {
        const { destination, budgetMin, budgetMax, startDate, travelStyle, page = 1, limit = 12 } = req.query;
        
        let query = { isActive: true };
        
        // Filters
        if (destination) {
            query.destination = new RegExp(destination, 'i');
        }
        
        if (budgetMin || budgetMax) {
            query.$and = [];
            if (budgetMin) query.$and.push({ 'budget.max': { $gte: parseInt(budgetMin) } });
            if (budgetMax) query.$and.push({ 'budget.min': { $lte: parseInt(budgetMax) } });
        }
        
        if (startDate) {
            query.startDate = { $gte: new Date(startDate) };
        }
        
        if (travelStyle) {
            query.travelStyle = { $in: [travelStyle] };
        }

        const trips = await TripRoom.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await TripRoom.countDocuments(query);

        res.json({
            trips,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Trips fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch trips' });
    }
});

// Get featured/popular trip rooms
router.get('/featured', async (req, res) => {
    try {
        const featuredTrips = await TripRoom.find({ 
            isActive: true,
            startDate: { $gte: new Date() },
            currentParticipants: { $gte: 2 }
        })
        .sort({ currentParticipants: -1, createdAt: -1 })
        .limit(8);

        res.json(featuredTrips);
    } catch (error) {
        console.error('Featured trips error:', error);
        res.status(500).json({ error: 'Failed to fetch featured trips' });
    }
});

// Get trip by ID
router.get('/:id', async (req, res) => {
    try {
        const trip = await TripRoom.findById(req.params.id);
        if (!trip) {
            return res.status(404).json({ error: 'Trip not found' });
        }
        res.json(trip);
    } catch (error) {
        console.error('Trip fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch trip' });
    }
});

// Create new trip room
router.post('/', async (req, res) => {
    try {
        const {
            title,
            destination,
            description,
            startDate,
            endDate,
            budget,
            maxParticipants,
            tags,
            travelStyle,
            accommodationType,
            creator
        } = req.body;

        const newTrip = new TripRoom({
            title,
            destination,
            description,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            budget,
            maxParticipants: maxParticipants || 10,
            creator,
            participants: [{
                userId: creator.id,
                name: creator.name,
                profilePicture: creator.profilePicture
            }], // Creator is first participant
            tags: tags || [],
            travelStyle: travelStyle || [],
            accommodationType
        });

        await newTrip.save();
        res.status(201).json({
            success: true,
            trip: newTrip,
            message: 'Trip room created successfully!'
        });
    } catch (error) {
        console.error('Trip creation error:', error);
        res.status(500).json({ error: 'Failed to create trip' });
    }
});

// Join trip room
router.post('/:id/join', requireAuth, async (req, res) => {
    try {
        const { userName, userProfilePicture } = req.body;
        const userId = (req.user && (req.user.id || req.user._id)) || req.body.userId;
        if (!userId) {
            return res.status(400).json({ error: 'Missing userId' });
        }
        
        const trip = await TripRoom.findById(req.params.id);
        if (!trip) {
            return res.status(404).json({ error: 'Trip not found' });
        }

        // Check if user already joined
        const alreadyJoined = trip.participants.some(p => p.userId && p.userId.toString() === String(userId));
        if (alreadyJoined) {
            return res.status(400).json({ error: 'Already joined this trip' });
        }

        // Check if trip is full
        if (trip.currentParticipants >= trip.maxParticipants) {
            return res.status(400).json({ error: 'Trip is full' });
        }

        // Add participant
        const uid = new mongoose.Types.ObjectId(String(userId));
        trip.participants.push({
            userId: uid,
            name: userName,
            profilePicture: userProfilePicture
        });
        // keep count consistent with array
        trip.currentParticipants = trip.participants.length;
        trip.updatedAt = new Date();

        await trip.save();

        res.json({
            success: true,
            message: 'Successfully joined the trip!',
            trip
        });
    } catch (error) {
        console.error('Join trip error:', error);
        res.status(500).json({ error: 'Failed to join trip' });
    }
});

// Leave trip room
router.post('/:id/leave', requireAuth, async (req, res) => {
    try {
        const userId = (req.user && (req.user.id || req.user._id)) || req.body.userId;
        if (!userId) {
            return res.status(400).json({ error: 'Missing userId' });
        }
        
        const trip = await TripRoom.findById(req.params.id);
        if (!trip) {
            return res.status(404).json({ error: 'Trip not found' });
        }

        // Remove participant
        const before = trip.participants.length;
        trip.participants = trip.participants.filter(p => p.userId && p.userId.toString() !== String(userId));
        const after = trip.participants.length;
        // keep count consistent with array
        trip.currentParticipants = after;
        trip.updatedAt = new Date();

        await trip.save();

        res.json({
            success: true,
            message: 'Successfully left the trip',
            trip
        });
    } catch (error) {
        console.error('Leave trip error:', error);
        res.status(500).json({ error: 'Failed to leave trip' });
    }
});

module.exports = router;
