// This file contains all cart related routes: fetching cart, adding/removing items, clearing, and checkout.


const express = require('express');
const { authenticate } = require('../middleware/auth');
const { Cart, CartItem, Component } = require('../models');
const crypto = require('crypto');
const router = express.Router();

// returns the logged-in user's active cart with all items and component info
router.get('/', authenticate, async (req, res) => {
  try {
    let cart = await Cart.findOne({
      where: { userId: req.user.id, status: 'active' },
      include: [
        {
          model: CartItem,
          as: 'CartItems',
          include: [{ model: Component }]
        }
      ]
    });

    if (!cart) {
      cart = await Cart.create({ userId: req.user.id, status: 'active' });
      cart = await Cart.findOne({
        where: { id: cart.id },
        include: [
          {
            model: CartItem,
            as: 'CartItems',
            include: [{ model: Component }]
          }
        ]
      });
    }

    res.status(200).json(cart);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// add one component to the cart
router.post('/add', authenticate, async (req, res) => {
  try {
    const { componentId, bicycleGroupId } = req.body;

    let cart = await Cart.findOne({
      where: { userId: req.user.id, status: 'active' }
    });

    if (!cart) {
      cart = await Cart.create({ userId: req.user.id, status: 'active' });
    }

    const groupId = bicycleGroupId || crypto.randomUUID();

    const cartItem = await CartItem.create({
      cartId: cart.id,
      bicycleGroupId: groupId,
      componentId: componentId,
      quantity: 1
    });

    res.status(201).json({ 
      message: 'Added to cart!', 
      item: cartItem, 
      cartId: cart.id 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// delete a single cart item (only if it belongs to the current user)
router.delete('/items/:itemId', authenticate, async (req, res) => {
  try {
    const { itemId } = req.params;

    const item = await CartItem.findByPk(itemId, {
      include: [{ model: Cart }]
    });

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    if (item.Cart.userId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await item.destroy();
    res.status(200).json({ message: 'Item removed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// remove all items from the active cart
router.delete('/clear', authenticate, async (req, res) => {
  try {
    const cart = await Cart.findOne({
      where: { userId: req.user.id, status: 'active' }
    });

    if (cart) {
      await CartItem.destroy({ where: { cartId: cart.id } });
    }

    res.status(200).json({ message: 'Cart cleared' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// mark the active cart as checked_out
router.put('/checkout', authenticate, async (req, res) => {
  try {
    const cart = await Cart.findOne({
      where: { userId: req.user.id, status: 'active' }
    });

    if (!cart) {
      return res.status(404).json({ error: 'No active cart' });
    }

    await cart.update({ status: 'checked_out' });
    res.status(200).json({ message: 'Cart checked out' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;