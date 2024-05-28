const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const adminAuthenticate = require('../middleware/adminAuth');

// Register route
router.post('/register', adminController.register);

// Login route
router.post('/login', adminController.login);

// Logout 
router.post('/logout',adminAuthenticate,adminController.logout);

router.get('/pending-requests',adminAuthenticate,adminController.getPendingRequests);

router.patch('/accept/:id',adminAuthenticate,adminController.acceptAccountApproval);
router.patch('/decline/:id',adminAuthenticate,adminController.declineAccountApproval);

router.get('/verified-accounts',adminAuthenticate,adminController.getVerifiedAccounts);
router.delete('/remove/:id',adminAuthenticate,adminController.removeFromVerifiedAccounts);

module.exports = router;
