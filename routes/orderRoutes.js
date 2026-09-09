// This file handles order routes: creating orders, fetching order history, and updating statuses.

const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const { Order, OrderItem, Cart, CartItem, Component } = require('../models');
const {
  createOrder,
  addComponentToBike,
  getAllOrders,
  getUserOrders,
  fulfillOrder,
  updateOrderStatus
} = require('../controllers/orderController');
const router = express.Router();

// all order routes need login
router.use(authenticate);

// create a new order from the active cart
router.post('/', createOrder);

// get the logged-in user's orders (excludes hidden)
router.get('/my-orders', getUserOrders);

// admin, clerk, and manager can see every order
router.get('/all', authorize('admin', 'clerk', 'manager'), getAllOrders);

// add a component to an existing order (used by the bike builder)
router.post('/:orderId/bike', addComponentToBike);

// update order status (admin and clerk only) - handles stock reduction on ready
router.put('/:orderId/status', authorize('admin', 'clerk'), updateOrderStatus);

// mark order as completed (admin and clerk) - old workflow (keep if needed)
router.put('/:orderId/fulfill', authorize('admin', 'clerk'), fulfillOrder);

// Cancel a pending order and permanently delete it
router.delete('/:orderId/cancel', async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findByPk(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.userId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    if (order.status !== 'pending') {
      return res.status(400).json({ error: 'Only pending orders can be cancelled' });
    }

    // delete items first
    await OrderItem.destroy({ where: { orderId: order.id } });

    // delete order
    await order.destroy();

    res.status(200).json({ message: 'Order cancelled and removed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Customer hides a completed order from their history, soft delete
router.put('/:orderId/hide', async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findByPk(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.userId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    if (order.status !== 'completed') {
      return res.status(400).json({ error: 'Only completed orders can be hidden' });
    }

    // soft delete - hide from customer, keep in database
    await order.update({ hiddenFromCustomer: true });

    res.status(200).json({ message: 'Order hidden from your history' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;