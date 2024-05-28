const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const userAuthenticate=require('../middleware/userAuth');

// Auth Routes
router.post('/register', userController.register);
router.post('/login', userController.login);
router.post('/logout',userAuthenticate,userController.logout);




module.exports = router;
