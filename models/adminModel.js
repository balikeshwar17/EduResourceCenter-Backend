const mongoose = require('mongoose');
const Paper=require('./paperModel');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    contact: {
        type: Number
    }
    ,
    count_of_papers_verified: {
        type: Number,
        default: 0
    },
    verification_pending_papers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Paper' 
    }],
    is_main:{
        type:Boolean,
        default:false
    },
    account_verification: {
        type: Boolean,
        default: false
    },
    refresh_token:{type:String},
});

const Admin = mongoose.model('Admin', userSchema);

module.exports = Admin;
