const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    firebaseUid: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    profilePicture: {
        type: String,
        default: ''
    },
    bio: {
        type: String,
        maxlength: 500,
        default: ''
    },
    location: {
        city: String,
        country: String,
        coordinates: {
            lat: Number,
            lng: Number
        }
    },
    dateOfBirth: Date,
    gender: {
        type: String,
        enum: ['male', 'female', 'non-binary', 'prefer-not-to-say'],
        default: 'prefer-not-to-say'
    },
    travelPreferences: {
        budgetRange: {
            min: { type: Number, default: 1000 },
            max: { type: Number, default: 50000 }
        },
        travelStyle: {
            type: [String],
            enum: ['adventure', 'relaxation', 'cultural', 'nightlife', 'nature', 'food', 'photography', 'backpacking', 'luxury'],
            default: []
        },
        accommodationType: {
            type: [String],
            enum: ['hostel', 'hotel', 'airbnb', 'camping', 'guesthouse'],
            default: []
        },
        groupSize: {
            type: String,
            enum: ['solo', 'small-group', 'large-group', 'any'],
            default: 'any'
        },
        languages: {
            type: [String],
            default: ['english']
        },
        interests: {
            type: [String],
            default: []
        }
    },
    verificationStatus: {
        isEmailVerified: { type: Boolean, default: false },
        isPhoneVerified: { type: Boolean, default: false },
        isIdVerified: { type: Boolean, default: false }
    },
    socialLinks: {
        instagram: String,
        facebook: String,
        linkedin: String
    },
    stats: {
        tripsCompleted: { type: Number, default: 0 },
        companionsFound: { type: Number, default: 0 },
        rating: { type: Number, default: 0 },
        reviewCount: { type: Number, default: 0 }
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastLogin: {
        type: Date,
        default: Date.now
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Index for better query performance
userSchema.index({ firebaseUid: 1 });
userSchema.index({ email: 1 });
userSchema.index({ 'location.city': 1 });
userSchema.index({ 'travelPreferences.budgetRange.min': 1, 'travelPreferences.budgetRange.max': 1 });

// Update the updatedAt field before saving
userSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Virtual for user's age
userSchema.virtual('age').get(function() {
    if (this.dateOfBirth) {
        return Math.floor((Date.now() - this.dateOfBirth) / (365.25 * 24 * 60 * 60 * 1000));
    }
    return null;
});

module.exports = mongoose.model('User', userSchema);
