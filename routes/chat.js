const express = require('express');
const mongoose = require('mongoose');
const requireAuth = require('../middleware/requireAuth');
const router = express.Router();

// Message Schema (inline for now)
const messageSchema = new mongoose.Schema({
    tripRoomId: { type: mongoose.Schema.Types.ObjectId, ref: 'TripRoom', required: true },
    sender: {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        name: String,
        profilePicture: String
    },
    message: { type: String, required: true, maxlength: 1000 },
    messageType: { type: String, enum: ['text', 'image', 'system'], default: 'text' },
    isRead: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

const Message = mongoose.model('Message', messageSchema);

// Get messages for a trip room
router.get('/:tripRoomId', async (req, res) => {
    try {
        const { tripRoomId } = req.params;
        const { page = 1, limit = 50 } = req.query;

        const messages = await Message.find({ tripRoomId })
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        res.json({
            messages: messages.reverse(), // Show oldest first
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit)
            }
        });
    } catch (error) {
        console.error('Messages fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});

// Send message to trip room
router.post('/:tripRoomId/send', requireAuth, async (req, res) => {
    try {
        const { tripRoomId } = req.params;
        const { message, sender } = req.body;

        const newMessage = new Message({
            tripRoomId,
            sender,
            message,
            messageType: 'text'
        });

        await newMessage.save();

        // In a real app, you'd emit this via Socket.IO to all room participants
        // io.to(tripRoomId).emit('new_message', newMessage);

        res.status(201).json({
            success: true,
            message: newMessage
        });
    } catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({ error: 'Failed to send message' });
    }
});

// Mark messages as read
router.put('/:tripRoomId/read', requireAuth, async (req, res) => {
    try {
        const { tripRoomId } = req.params;
        const { userId } = req.body;

        await Message.updateMany(
            { 
                tripRoomId, 
                'sender.userId': { $ne: userId },
                isRead: false 
            },
            { isRead: true }
        );

        res.json({ success: true });
    } catch (error) {
        console.error('Mark read error:', error);
        res.status(500).json({ error: 'Failed to mark messages as read' });
    }
});

module.exports = router;
