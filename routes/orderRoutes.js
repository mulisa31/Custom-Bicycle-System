// This file handles order routes: creating orders, fetching order history, and updating statuses.


const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const { Order, OrderItem, Cart, CartItem, Component } = require('../models');
const router = express.Router();


// all order routes need login
router.use(authenticate);



// create a new order from the active cart
router.post('/', async (req, res) => {
  try {
    const { totalPrice, shippingProvince, shippingCity, shippingPostcode, shippingAddress } = req.body;

    const order = await Order.create({
      userId: req.user.id,
      status: 'pending',
      totalPrice: totalPrice || 0,
      shippingProvince: shippingProvince || null,
      shippingCity: shippingCity || null,
      shippingPostcode: shippingPostcode || null,
      shippingAddress: shippingAddress || null,
    });


    // copy items from the active cart into the order
    const cart = await Cart.findOne({
      where: { userId: req.user.id, status: 'active' },
      include: [{ model: CartItem, as: 'CartItems' }]
    });

    if (cart && cart.CartItems && cart.CartItems.length > 0) {
      for (let item of cart.CartItems) {
        await OrderItem.create({
          orderId: order.id,
          bicycleGroupId: item.bicycleGroupId,
          componentId: item.componentId,
          quantity: item.quantity || 1,
          compatibilityChecked: true,
        });
      }
    }

    res.status(201).json({ message: 'Order created', order: order });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});



// get the logged-in user's orders
router.get('/my-orders', async (req, res) => {
  try {
    const orders = await Order.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: OrderItem,
          include: [{ model: Component }]
        }
      ]
    });

    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});



// admin, clerk, and manager can see every order
router.get('/all', authorize('admin', 'clerk', 'manager'), async (req, res) => {
  try {
    const orders = await Order.findAll({
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: OrderItem,
          include: [{ model: Component }]
        }
      ]
    });

    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});



// add a component to an existing order (used by the bike builder)
router.post('/:orderId/bike', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { componentId, bicycleGroupId } = req.body;

    const order = await Order.findByPk(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const orderItem = await OrderItem.create({
      orderId: order.id,
      bicycleGroupId: bicycleGroupId || require('crypto').randomUUID(),
      componentId: componentId,
      quantity: 1,
    });

    res.status(201).json({ message: 'Component added to order', item: orderItem });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// update order status (admin and clerk only)
router.put('/:orderId/status', authorize('admin', 'clerk'), async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const order = await Order.findByPk(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    await order.update({ status: status });
    res.status(200).json({ message: 'Order status updated', order: order });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// mark order as completed (admin and clerk)
router.put('/:orderId/fulfill', authorize('admin', 'clerk'), async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findByPk(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    await order.update({ status: 'completed' });
    res.status(200).json({ message: 'Order fulfilled', order: order });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// Cancel a pending order and permanently delete it
router.delete('/:orderId/cancel', authenticate, async (req, res) => {
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
router.put('/:orderId/hide', authenticate, async (req, res) => {
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

    // soft delete- hide from customer, keep in database
    await order.update({ hiddenFromCustomer: true });

    res.status(200).json({ message: 'Order hidden from your history' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;