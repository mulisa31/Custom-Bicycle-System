// This file handles user related operations for admin and profile pages.

const bcrypt = require('bcryptjs');
const { User } = require('../models');

// get all customers (admin only)
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

// get own profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'name', 'email', 'contact', 'role', 'preference', 'address', 'province', 'city', 'postalCode', 'createdAt']
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// update own profile
const updateProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

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
    if (req.body.address !== undefined) {
      user.address = req.body.address;
    }
    if (req.body.province !== undefined) {
      user.province = req.body.province;
    }
    if (req.body.city !== undefined) {
      user.city = req.body.city;
    }
    if (req.body.postalCode !== undefined) {
      user.postalCode = req.body.postalCode;
    }

    await user.save();

    const userResponse = user.toJSON();
    delete userResponse.password;
    res.status(200).json({ message: 'Profile updated', user: userResponse });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getAllCustomers, getProfile, updateProfile };