// This file handles user related operations for admin and profile pages.
const bcrypt = require('bcryptjs');
const { User } = require('../models');

// get list of customers for the admin dashboard
const getAllCustomers = async (req, res) => {
  try {
    const customers = await User.findAll({
      where: { role: 'customer' },
      attributes: ['id', 'name', 'email', 'contact', 'createdAt'],
      order: [['createdAt', 'DESC']]
    });
    res.status(200).json(customers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// fetch the logged-in user's own profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'name', 'email', 'contact', 'role', 'preference', 'createdAt']
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// let a user update their own details
const updateProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // only change fields that were actually sent
    if (req.body.name !== undefined && req.body.name !== '') {
      user.name = req.body.name;
    }
    if (req.body.contact !== undefined && req.body.contact !== '') {
      user.contact = req.body.contact;
    }
    if (req.body.preference !== undefined) {
      user.preference = req.body.preference;
    }
    if (req.body.password !== undefined && req.body.password !== '') {
      user.password = await bcrypt.hash(req.body.password, 10);
    }

    await user.save();

    // remove password before sending back
    const userResponse = user.toJSON();
    delete userResponse.password;
    res.status(200).json({ message: 'Profile updated', user: userResponse });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// export the functions
module.exports = { getAllCustomers, getProfile, updateProfile };