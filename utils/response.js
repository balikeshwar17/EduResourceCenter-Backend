const express=require('express');
const sendResponse = (res, status, message, notify, data) => {
    return res.status(status).json({ message, status, notify, data });
};
  
module.exports = sendResponse;