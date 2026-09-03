// This file defines all component routes including public viewing and admin management.


const express = require('express');

const router = express.Router();
const { authenticate } = require('../middleware/auth');

const componentController = require('../controllers/componentController');
const { Component } = require('../models');


// public routes: anyone can view the list or a single component
router.get('/', componentController.getAllComponents);
router.get('/:id', componentController.getComponentById);


// everything below requires login
router.use(authenticate);


// admin-only routes for creating, updating, and deleting components
router.post('/', componentController.createComponent);
router.put('/:id', componentController.updateComponent);
router.delete('/:id', componentController.deleteComponent);


// endpoint used after an order to reduce the stock of a component
router.put('/:id/reduce-stock', async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;

    const component = await Component.findByPk(id);

    if (!component) {
      return res.status(404).json({ error: 'Component not found' });
    }

    const newStock = Math.max(0, component.stockQuantity - (quantity || 1));
    await component.update({ stockQuantity: newStock });

    res.status(200).json({ message: 'Stock updated', component: component });
  } catch (error) {
    console.error('Reduce stock error:', error);
    res.status(500).json({ error: error.message });
  }
});


module.exports = router;