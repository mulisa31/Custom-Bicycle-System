// This file deals with order creation, adding components, fetching orders, and updating statuses.
// It also handles stock reduction when an order moves to ready.

const { Order, OrderItem, Component, Compatibility, User, sequelize } = require('../models');
const { v4: uuidv4 } = require('uuid');

// helper to check if two components can go together (not used now, but kept for reference)
const checkCompatibility = async (groupId, newComponentId) => {
  const existingItems = await OrderItem.findAll({ where: { bicycleGroupId: groupId } });
  const existingComponentIds = existingItems.map(item => item.componentId);
  if (existingComponentIds.length === 0) return { compatible: true };
  for (let oldId of existingComponentIds) {
    const rule = await Compatibility.findOne({
      where: {
        [sequelize.Op.or]: [
          { componentAId: oldId, componentBId: newComponentId },
          { componentAId: newComponentId, componentBId: oldId }
        ]
      }
    });
    if (rule && rule.compatible === false) {
      const oldComp = await Component.findByPk(oldId);
      const newComp = await Component.findByPk(newComponentId);
      return { compatible: false, conflictWith: oldComp.name };
    }
  }
  return { compatible: true };
};

// create a new empty order (usually when customer checks out)
const createOrder = async (req, res) => {
  try {
    const { totalPrice, shippingProvince, shippingCity, shippingPostcode, shippingAddress } = req.body;
    const newOrder = await Order.create({
      userId: req.user.id,
      status: 'pending',
      totalPrice: totalPrice || 0,
      shippingProvince: shippingProvince || null,
      shippingCity: shippingCity || null,
      shippingPostcode: shippingPostcode || null,
      shippingAddress: shippingAddress || null,
    });
    res.status(201).json({ message: 'Order created!', orderId: newOrder.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// add a component to an existing pending order (used by bike builder)
const addComponentToBike = async (req, res) => {
  const { orderId } = req.params;
  const { componentId, bicycleGroupId } = req.body;

  try {
    const order = await Order.findOne({
      where: { id: orderId, userId: req.user.id, status: 'pending' },
    });
    if (!order) return res.status(404).json({ error: 'Order not found or already processed.' });

    const component = await Component.findByPk(componentId);
    if (!component) return res.status(404).json({ error: 'Component not found.' });
    if (component.stockQuantity <= 0) return res.status(400).json({ error: 'Component out of stock.' });

    let groupId = bicycleGroupId || uuidv4();

    // compatibility check
    const existingItems = await OrderItem.findAll({
      where: { bicycleGroupId: groupId },
      include: [{ model: Component }],
    });

    for (let item of existingItems) {
      const rule = await Compatibility.findOne({
        where: {
          [sequelize.Op.or]: [
            { componentAId: item.componentId, componentBId: componentId },
            { componentAId: componentId, componentBId: item.componentId },
          ],
        },
      });
      if (rule && rule.compatible === false) {
        return res.status(400).json({
          error: `${component.name} is NOT compatible with ${item.Component.name}`,
        });
      }
    }

    const orderItem = await OrderItem.create({
      orderId: order.id,
      bicycleGroupId: groupId,
      componentId: component.id,
      quantity: 1,
      compatibilityChecked: true,
    });

    const items = await OrderItem.findAll({
      where: { orderId: order.id },
      include: [{ model: Component }],
    });
    let totalPrice = 0;
    for (let item of items) {
      totalPrice += item.Component.unitPrice * item.quantity;
    }
    await order.update({ totalPrice });

    res.status(200).json({
      message: 'Component added to bike!',
      bicycleGroupId: groupId,
      orderItem,
      newTotalPrice: totalPrice,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// get all orders for clerks/admin with customer and item info
const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.findAll({
      include: [
        { model: User, attributes: ['id', 'name', 'email'] },
        { model: OrderItem, include: [{ model: Component }] }
      ],
      order: [['createdAt', 'DESC']]
    });
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// get the logged-in user's own orders
const getUserOrders = async (req, res) => {
  try {
    const orders = await Order.findAll({
      where: { userId: req.user.id },
      include: [{ model: OrderItem, include: [{ model: Component }] }],
      order: [['createdAt', 'DESC']]
    });
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// fulfill an order: reduce stock and set status to ready (used by older workflow)
const fulfillOrder = async (req, res) => {
  const { orderId } = req.params;
  const transaction = await sequelize.transaction();
  try {
    const order = await Order.findByPk(orderId, { transaction });
    if (!order) return res.status(404).json({ error: 'Order not found.' });
    if (order.status !== 'pending') return res.status(400).json({ error: 'Order already processed.' });
    const items = await OrderItem.findAll({
      where: { orderId: order.id },
      include: [{ model: Component }],
      transaction
    });
    for (let item of items) {
      const comp = item.Component;
      if (comp.stockQuantity < item.quantity) {
        throw new Error(`Insufficient stock for ${comp.name}. Available: ${comp.stockQuantity}`);
      }
      await comp.update({ stockQuantity: comp.stockQuantity - item.quantity }, { transaction });
    }
    await order.update({ status: 'ready' }, { transaction });
    await transaction.commit();
    res.status(200).json({ message: 'Order fulfilled successfully! Stock updated.' });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ error: error.message });
  }
};

// update order status with allowed transitions and stock reduction on ready
const updateOrderStatus = async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;

  const validStatuses = ['pending', 'assembling', 'ready', 'shipped', 'completed'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status.' });
  }

  const transaction = await sequelize.transaction();
  try {
    const order = await Order.findByPk(orderId, { transaction });
    if (!order) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Order not found.' });
    }

    const currentStatus = order.status;

    const allowedTransitions = {
      pending: ['assembling'],
      assembling: ['ready'],
      ready: ['shipped', 'completed'],
      shipped: ['completed'],
      completed: ['shipped']
    };

    if (!allowedTransitions[currentStatus]?.includes(status)) {
      await transaction.rollback();
      return res.status(400).json({
        error: `Cannot change status from "${currentStatus}" to "${status}".`
      });
    }

    // if moving to ready, subtract stock for each item
    if (status === 'ready' && currentStatus !== 'ready') {
      const items = await OrderItem.findAll({
        where: { orderId: order.id },
        include: [{ model: Component }],
        transaction
      });

      for (let item of items) {
        const comp = item.Component;
        if (comp.stockQuantity < item.quantity) {
          await transaction.rollback();
          return res.status(400).json({
            error: `Insufficient stock for ${comp.name}. Available: ${comp.stockQuantity}`
          });
        }
        await comp.update(
          { stockQuantity: comp.stockQuantity - item.quantity },
          { transaction }
        );
      }
    }

    await order.update({ status }, { transaction });
    await transaction.commit();
    res.status(200).json({ message: `Order status updated to ${status}` });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ error: error.message });
  }
};

module.exports = { createOrder, addComponentToBike, getAllOrders, getUserOrders, fulfillOrder, updateOrderStatus };