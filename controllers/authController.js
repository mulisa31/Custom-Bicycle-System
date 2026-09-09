// This File handles user registration and login for the whole system.
// Generates JWT token on login so the frontend can access protected routes.

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

// register a new user
const register = async (req, res) => {
  try {
    const { name, contact, email, password, role, preference, address, province, city, postalCode } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'Password is required.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name,
      contact,
      email,
      password: hashedPassword,
      role: role || 'customer',
      preference: preference || null,
      address: address || null,
      province: province || null,
      city: city || null,
      postalCode: postalCode || null
    });

    const userResponse = newUser.toJSON();
    delete userResponse.password;

    res.status(201).json({ message: 'User registered successfully!', user: userResponse });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'Email is already taken.' });
    }
    res.status(500).json({ error: error.message });
  }
};

// login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(401).json({ error: 'Invalid email or password.' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid email or password.' });

    const loginUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      contact: user.contact,
      address: user.address,
      province: user.province,
      city: user.city,
      postalCode: user.postalCode,
      preference: user.preference
    };

    const token = jwt.sign(loginUser, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(200).json({ message: 'Login successful!', token, user: loginUser });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { register, login };