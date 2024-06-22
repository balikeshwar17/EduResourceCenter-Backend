const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const sendResponse = require('../utils/response');
const generateTokens=require('../utils/generateTokens');
require('dotenv').config();


exports.register = async (req, res) => {
    try {
        const isProduction = process.env.NODE_ENV === 'production';
        let { username, email, password, contact, college, course, department, semester} = req.body;
      
        // Check if user already exists
        let existUser = await User.findOne({ email });
        if (existUser) {
            return sendResponse(res, 400, 'Failed', 'User already exists', null);
        }

    

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        // console.log(hashedPassword);

        // Create user
        let newUser = new User({
            username,
            email,
            password: hashedPassword,
            contact,
            college,
            course,
            department,
            semester
        });

        let ACCESS_TOKEN_SECRETKEY = process.env.ACCESS_TOKEN_SECRETKEY;
        let REFRESH_TOKEN_SECRETKEY = process.env.REFRESH_TOKEN_SECRETKEY;

        const access_token = jwt.sign({ userId: newUser._id }, ACCESS_TOKEN_SECRETKEY, { expiresIn: '30m' });
        const refresh_token = jwt.sign({ userId: newUser._id }, REFRESH_TOKEN_SECRETKEY, { expiresIn: '8d' });

        newUser.refresh_token=refresh_token;   
    
        const savedUser = await newUser.save();
    
        res.cookie('access_token', access_token, { maxAge: 30 * 60 * 1000, httpOnly: true,secure: false,sameSite: 'None'}); //30min
        res.cookie('refresh_token', refresh_token, { maxAge: 7 * 24 * 60 * 60 * 1000, httpOnly: true,secure: false,sameSite: 'None' }); //7days

        const userDataToSend = {
            _id: savedUser._id,
            username:username,
            email: savedUser.email,
            contact:savedUser.contact,
          };
      
          return sendResponse(res, 201, "Success", "User saved successfully!", userDataToSend);

    } catch (error) {
        // console.error(error);
        return sendResponse(res, 500, 'Failed', 'Internal server error', error.message);
    }
};

exports.login = async (req, res) => {
    try {
        const isProduction = process.env.NODE_ENV === 'production';
        const {userType, email, password } = req.body;
       
        
        const existUser = await User.findOne({ email: email });
    
        if (!existUser) {
          return sendResponse(res, 404, "Failed", "User does not exist!", null);
        }
    
        const storedHashedPassword = existUser.password;
        const isPasswordValid = await bcrypt.compare(password, storedHashedPassword);
        if (isPasswordValid) {
        const { access_token, refresh_token } = generateTokens(existUser,userType);
          

          res.cookie('access_token', access_token, { maxAge: 30 * 60 * 1000, httpOnly: true,secure: false,sameSite: 'None'}); //30min
          res.cookie('refresh_token', refresh_token, { maxAge: 7 * 24 * 60 * 60 * 1000, httpOnly: true,secure: false,sameSite: 'None' }); //7days

          existUser.refresh_token = refresh_token;
          await existUser.save();

          // console.log('hi');
    
          const userDataToSend = {
            _id: existUser._id,
            email: existUser.email,
            contact:existUser.contact,
            address:existUser.address
          };
          // console.log(userDataToSend);

          return sendResponse(res, 200, "Success", "Login successful!", userDataToSend);
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



