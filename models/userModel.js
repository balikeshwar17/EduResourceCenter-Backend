const mongoose = require('mongoose');
const Paper=require('./paperModel');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        maxlength: 40,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true 
    },
    password: {
        type: String,
        required: true
    },
    contact: {
        type: Number,
        required: true
    },
    college: {
        type: String,
        required: true
    },
    course: {
        type: String,
        enum: ['btech', 'mtech', 'msc', 'mba', 'phd'],
        required: true
    },
    department: {
        type: String,
        required: true
    },
    semester: {
        type: Number,
        required: true
    },
    street: {
        type: String
    },
    city: {
        type: String
    },
    district: {
        type: String
    },
    state: {
        type: String
    },
    postal_code: {
        type: Number
    },
    country: {
        type: String
    },
    papers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Paper'
    }],
    count_of_paper_rejection: {
        type: Number,
        default: 0
    },
    refresh_token:{type:String},
});

// Middleware to check if count_of_paper_rejection exceeds 4
userSchema.pre('save', function(next) {
    if (this.count_of_paper_rejection > 4) {
        // Assuming 'blocked' is a boolean field indicating whether the user is blocked
        this.blocked = true;
    }
    next();
});

const User = mongoose.model('User', userSchema);

module.exports = User;
