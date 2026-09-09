// This file handles order routes: creating orders, fetching order history, and updating statuses.


const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const { Order, OrderItem, Cart, CartItem, Component, User, sequelize } = require('../models');
const router = express.Router();

// all order routes need login
router.use(authenticate);

// create a new order and copy cart items into it
router.post('/', async (req, res) => {
  try {
    const { totalPrice, shippingProvince, shippingCity, shippingPostcode, shippingAddress } = req.body;

    // fallback to user profile address if not provided
    const userProfile = await User.findByPk(req.user.id);
    const finalProvince = shippingProvince || userProfile?.province || null;
    const finalCity = shippingCity || userProfile?.city || null;
    const finalPostcode = shippingPostcode || userProfile?.postalCode || null;
    const finalAddress = shippingAddress || userProfile?.address || null;

    const order = await Order.create({
      userId: req.user.id,
      status: 'pending',
      totalPrice: totalPrice || 0,
      shippingProvince: finalProvince,
      shippingCity: finalCity,
      shippingPostcode: finalPostcode,
      shippingAddress: finalAddress,
    });

    // copy active cart items into order items
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

    res.status(201).json({ message: 'Order created', orderId: order.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// get logged-in user's orders (hide completed orders they deleted)
router.get('/my-orders', async (req, res) => {
  try {
    const orders = await Order.findAll({
      where: { userId: req.user.id, hiddenFromCustomer: false },
      include: [{ model: OrderItem, include: [{ model: Component }] }],
      order: [['createdAt', 'DESC']]
    });
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// admin, clerk, manager can see all orders
router.get('/all', authorize('admin', 'clerk', 'manager'), async (req, res) => {
  try {
    const orders = await Order.findAll({
      include: [{ model: User, attributes: ['id', 'name', 'email'] }, { model: OrderItem, include: [{ model: Component }] }],
      order: [['createdAt', 'DESC']]
    });
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// add a component to an existing order (bike builder)
router.post('/:orderId/bike', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { componentId, bicycleGroupId } = req.body;

    const order = await Order.findByPk(orderId);
    if (!order) return res.status(404).json({ error: 'Order not found' });

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

// update order status (clerk/admin) with stock reduction when ready
router.put('/:orderId/status', authorize('admin', 'clerk'), async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;

  const validStatuses = ['pending', 'assembling', 'ready', 'shipped', 'completed'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  try {
    const order = await Order.findByPk(orderId);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const currentStatus = order.status;
    const allowedTransitions = {
      pending: ['assembling'],
      assembling: ['ready'],
      ready: ['shipped', 'completed'],
      shipped: ['completed'],
      completed: []
    };

    if (!allowedTransitions[currentStatus]?.includes(status)) {
      return res.status(400).json({ error: `Cannot change from ${currentStatus} to ${status}` });
    }

    // if moving to ready, reduce stock
    if (status === 'ready' && currentStatus !== 'ready') {
      const items = await OrderItem.findAll({ where: { orderId }, include: [{ model: Component }] });
      for (let item of items) {
        const comp = item.Component;
        if (comp.stockQuantity < item.quantity) {
          return res.status(400).json({ error: `Insufficient stock for ${comp.name}` });
        }
        await comp.update({ stockQuantity: comp.stockQuantity - item.quantity });
      }
    }

    await order.update({ status });
    res.status(200).json({ message: `Order status updated to ${status}` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// cancel pending order permanently
router.delete('/:orderId/cancel', async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findByPk(orderId);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.userId !== req.user.id) return res.status(403).json({ error: 'Unauthorized' });
    if (order.status !== 'pending') return res.status(400).json({ error: 'Only pending orders can be cancelled' });

    await OrderItem.destroy({ where: { orderId: order.id } });
    await order.destroy();
    res.status(200).json({ message: 'Order cancelled' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// customer hides completed order
router.put('/:orderId/hide', async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findByPk(orderId);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.userId !== req.user.id) return res.status(403).json({ error: 'Unauthorized' });
    if (order.status !== 'completed') return res.status(400).json({ error: 'Only completed orders can be hidden' });

    await order.update({ hiddenFromCustomer: true });
    res.status(200).json({ message: 'Order hidden from history' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;