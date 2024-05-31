const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../models/adminModel');
const sendResponse = require('../utils/response');
const generateTokens=require('../utils/generateTokens');
require('dotenv').config();

// Admin registration function
exports.register = async (req, res) => {
    try {
        const {userType, username, email, password, contact } = req.body;
        //  console.log(req.body);
        // Check if the admin already exists
        const existingAdmin = await Admin.findOne({ email });
        // console.log(existingAdmin);

        if (existingAdmin) {
            // console.log('hii');
            return sendResponse(res, 409, 'Failed', 'Admin already exists', null);
          
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new admin
        const newAdmin = new Admin({
            username,
            email,
            password: hashedPassword,
            contact,
            account_verification:false
        });

        const savedAdmin = await newAdmin.save();


        const adminDataToSend = {
            _id: savedAdmin._id,
            username: savedAdmin.username,
            email: savedAdmin.email,
            contact: savedAdmin.contact,
        };

        return sendResponse(res, 201, "Success", "Admin registered successfully!", adminDataToSend);

    } catch (error) {
        // console.error(error);
        return sendResponse(res, 500, 'Failed', 'Internal server error', error.message);
    }
};

// Admin login function
exports.login = async (req, res) => {
    try {
        const {userType, email, password } = req.body;
    
        const existUser = await Admin.findOne({ email: email });

        if (!existUser) {
          // console.log('hi');
          return sendResponse(res, 404, "Failed", "User does not exist!", null);
        }

        if(!existUser.account_verification){
         return sendResponse(res,401,"Failded","Unauthorized! Account is not verified yet",null);
        }
    
        const storedHashedPassword = existUser.password;
        const isPasswordValid = await bcrypt.compare(password, storedHashedPassword);
        if (isPasswordValid) {
          const { access_token, refresh_token } = generateTokens(existUser,userType);
          
          res.clearCookie('access_token');
          res.clearCookie('refresh_token');
    
          res.cookie('access_token', access_token, { maxAge: 2 * 60 * 1000, httpOnly: true,secure: false }); //2min
          res.cookie('refresh_token', refresh_token, { maxAge: 6 * 24 * 60 * 60 * 1000, httpOnly: true,secure: false }); //7days
          
          existUser.refresh_token = refresh_token;
          await existUser.save();
    
          const userDataToSend = {
            _id: existUser._id,
            email: existUser.email,
            contact:existUser.contact,
            address:existUser.address
          };
          
          return  sendResponse(res, 200, "Success", "Login successful!", userDataToSend);
        } else {
           return sendResponse(res, 401, "Failed", "Invalid credentials", null);
        }
        } catch (error) {
        return sendResponse(res, 500, "Failed", "Error during login", error.message);
      }
};

exports.logout = async (req, res) => {
  try {
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
    return sendResponse(res, 200, "Success", "Logout successful", null);
  } catch (error) {
    return sendResponse(res, 500, "Failed", "Error during logout", error.message);
  }
};

exports.getPendingRequests = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1; // Current page number
    const limit = parseInt(req.query.limit) || 10; // Number of documents per page
    const skip = (page - 1) * limit; // Calculate the skip value

    // Find pending requests with pagination
    const requests = await Admin.find({ account_verification: false }, '_id username email contact')
      .skip(skip)
      .limit(limit);

    // Get the total count of pending requests
    const totalCount = await Admin.countDocuments({ account_verification: false });

    // Calculate the total number of pages based on the total count and limit
    const totalPages = Math.ceil(totalCount / limit);

    // Send the response with the pending requests and pagination info
    sendResponse(res, 200, "Pending requests fetched successfully", true, {
      requests,
      totalPages,
      currentPage: page
    });
  } catch (error) {
    sendResponse(res, 500, "Failed", "Error", error.message);
  }
};


exports.acceptAccountApproval=async(req,res)=>{
  try{
    const adminId = req.params.id; // Assuming the admin ID is passed as a URL parameter

    // Find the admin by ID and update the account_verification field to true
    const updatedAdmin = await Admin.findByIdAndUpdate(
      adminId,
      { account_verification: true },
      { new: true }
    );

    if (!updatedAdmin) {
      return sendResponse(res, 404, "Failed", "Admin not found", null);
    }

    sendResponse(res, 200, "Account approved successfully", true, updatedAdmin);
  }
  catch(error){
    sendResponse(res, 500, "Failed", "Operation Failded", error.message);
  }
}

exports.declineAccountApproval=async(req,res)=>{
  try{
    const adminId = req.params.id; // Assuming the admin ID is passed as a URL parameter

    // Find the admin by ID and remove it
    const deletedAdmin = await Admin.findByIdAndDelete(adminId);

    if (!deletedAdmin) {
      return sendResponse(res, 404, "Failed", "Admin not found", null);
    }

    sendResponse(res, 200, "Account declined and admin removed successfully", true, deletedAdmin);
  }
  catch(error){
    sendResponse(res, 500, "Failed", "Operation Failded", error.message);
  }
}

exports.getVerifiedAccounts = async (req, res) => {
  try {
    const currentAdminId = req.user._id;

    const page = parseInt(req.query.page) || 1; // Current page number
    const limit = parseInt(req.query.limit) || 10; // Number of documents per page
    const skip = (page - 1) * limit; // Calculate the skip value

    // Find all verified admins except the current admin with pagination
    const verifiedAdmins = await Admin.find({
      account_verification: true,
      _id: { $ne: currentAdminId },
      is_main: { $ne: true }
    })
    .select('username email contact')
    .skip(skip)
    .limit(limit);

    // Get the total count of verified admins except the current admin
    const totalCount = await Admin.countDocuments({
      account_verification: true,
      _id: { $ne: currentAdminId },
      is_main: { $ne: true }
    });

    // Calculate the total number of pages based on the total count and limit
    const totalPages = Math.ceil(totalCount / limit);

    // Send the response with the verified accounts and pagination info
    sendResponse(res, 200, "Verified accounts fetched successfully", true, {
      verifiedAdmins,
      totalPages,
      currentPage: page
    });
  } catch (error) {
    sendResponse(res, 500, "Failed", "Operation Failed", error.message);
  }
};


exports.removeFromVerifiedAccounts=async(req,res)=>{
  try{
    const adminId = req.params.id; // Assuming the admin ID is passed as a URL parameter
 
    // Find the admin by ID and remove it
    const removedAdmin = await Admin.findByIdAndDelete(adminId);
    console.log(removedAdmin);

    if (!removedAdmin) {
      return sendResponse(res, 404, "Failed", "Admin not found", null);
    }

    sendResponse(res, 200, "Account declined and admin removed successfully", true, removedAdmin);
  }
  catch(error){
    sendResponse(res, 500, "Failed", "Operation Failded", error.message);
  }
}





