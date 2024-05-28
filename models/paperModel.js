const mongoose = require('mongoose');
const User=require('./userModel');
const Admin=require('./adminModel');

const paperSchema = new mongoose.Schema({
    paper_name: {
        type: String
    },
    paper_link:{
        type:String
    },
    college: {
        type: String
    },
    college_email: {
        type: String
    },
    college_contact: {
        type: Number
    },
    course: {
        type: String,
    },
    department: {
        type: String,
    },
    semester: {
        type: Number
    },
    exam_type: {
        type: String,
        enum: ['quiz1','quiz2','midsem', 'endsem'],
    },
    year: {
        type: Number,
    },
    status_of_verification: {
        type: Number,
        enum: [0, 1,-1,2],
        default: 0
    },
    is_valid:{
        type:Number,
        enum: [0, 1],
        default: 0
    },
    verified_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin'
    },
    uploaded_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    },
    uploaded_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
});

// compound index on all fields
paperSchema.index({
    college: 1,
    department: 1,
    year: 1,
    exam_type: 1
});


const Paper = mongoose.model('Paper', paperSchema);

module.exports = Paper;
