const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const Admin = require('../models/adminModel');
const generateTokens = require('../utils/generateTokens');
const sendResponse = require('../utils/response');
require('dotenv').config();

const ACCESS_TOKEN_SECRETKEY = process.env.ACCESS_TOKEN_SECRETKEY;
const REFRESH_TOKEN_SECRETKEY = process.env.REFRESH_TOKEN_SECRETKEY;

const userAuthenticate = async (req, res, next) => {
  try {
    if (!ACCESS_TOKEN_SECRETKEY || !REFRESH_TOKEN_SECRETKEY) {
      return sendResponse(res, 500, 'Internal Server Error', 'Secret keys not provided.', null);
    }

    const incomingAccessToken = req.cookies.access_token;
    const incomingRefreshToken = req.cookies.refresh_token;

    // console.log('hi');
    // console.log(incomingAccessToken);
    // console.log(incomingRefreshToken);
    // console.log('hi');

    if (!incomingAccessToken && !incomingRefreshToken) {
      return sendResponse(res, 401, 'Unsuccessful', 'Access token and refresh token are missing.', null);
    }

    if (!incomingAccessToken) {
      try {
        jwt.verify(incomingRefreshToken, REFRESH_TOKEN_SECRETKEY, async (err, decoded) => {
          if (err) {
            // console.log('err1',err);
            return sendResponse(res, 401, 'Unsuccessful', 'Error in verification of refresh token', err);
          }

          const existUser = await User.findById(decoded.userId) ;
          if (!existUser) {
            return sendResponse(res, 401, 'Unsuccessful', 'User does not exist.', null);
          }

          const storedRefreshToken = existUser.refresh_token;

          if (storedRefreshToken !== incomingRefreshToken) {
            return sendResponse(res, 401, 'Unsuccessful', 'Refresh token not matching', null);
          }

          const { access_token, refresh_token } = generateTokens(existUser, decoded.userType);

          res.clearCookie('access_token');
          res.clearCookie('refresh_token');

          res.cookie('access_token', access_token, { 
            maxAge: 2 * 60 * 1000,
            httpOnly: true, 
            secure: false}); // 2 minutes
          res.cookie('refresh_token', refresh_token, {
             maxAge: 7 * 24 * 60 * 60 * 1000, 
             httpOnly: true, 
             secure: false // Use secure cookies in production
             }); // 7 days

          existUser.refresh_token = refresh_token;
          await existUser.save();

          req.user = existUser;
          next();
        });
      } catch (error) {
        return sendResponse(res, 500, 'Failed', 'Internal Server Error.', null);
      }
    } else {
      jwt.verify(incomingAccessToken, ACCESS_TOKEN_SECRETKEY, async (err, decoded) => {
        if (err) {
          // console.log(err);
          return sendResponse(res, 403, 'Failed', 'Error in access token matching', err);
        }
        
        const existUser =  await User.findById(decoded.userId) ;
        req.user = existUser;
        next();
      });
    }
  } catch (error) {
    return sendResponse(res, 500, 'Failed', 'Internal Server Error', null);
  }
};

module.exports = userAuthenticate;
