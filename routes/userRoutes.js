// This file defines user routes for fetching customers and managing the logged-in user's profile.

const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const { getAllCustomers, getProfile, updateProfile } = require('../controllers/userController');
const { User } = require('../models');
const router = express.Router();

// Only admin can view all customers
router.get('/customers', authenticate, authorize('admin'), getAllCustomers);

// Get own profile
router.get('/profile', authenticate, getProfile);

// Update own profile
router.put('/profile', authenticate, updateProfile);

// Admin updates a customer
router.put('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (req.body.name !== undefined) user.name = req.body.name;
    if (req.body.contact !== undefined) user.contact = req.body.contact;
    if (req.body.preference !== undefined) user.preference = req.body.preference;
    if (req.body.address !== undefined) user.address = req.body.address;
    if (req.body.province !== undefined) user.province = req.body.province;
    if (req.body.city !== undefined) user.city = req.body.city;
    if (req.body.postalCode !== undefined) user.postalCode = req.body.postalCode;

    await user.save();
    const userResponse = user.toJSON();
    delete userResponse.password;
    res.status(200).json({ message: 'Customer updated', user: userResponse });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin deletes a customer
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    await user.destroy();
    res.status(200).json({ message: 'Customer deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;