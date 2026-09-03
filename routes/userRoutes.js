// This file defines user routes for fetching customers and managing the logged-in user's profile.


const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const { getAllCustomers, getProfile, updateProfile } = require('../controllers/userController');
const router = express.Router();


// Only admin can view all customers
router.get('/customers', authenticate, authorize('admin'), getAllCustomers);




// Get own profile
router.get('/profile', authenticate, getProfile);


// Update own profile
router.put('/profile', authenticate, updateProfile);


module.exports = router;