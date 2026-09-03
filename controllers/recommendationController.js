// This file gives bike component suggestions to logged-in users based on their preference or order history.
const { Component, Order, OrderItem, sequelize } = require('../models');
const { Op } = require('sequelize');

// map each bike preference to the categories we should suggest
const preferenceMap = {
  'Road Bike': ['Frame', 'Wheels', 'Handlebars', 'Brakes'],
  'Mountain Bike': ['Frame', 'Fork', 'Wheels', 'Handlebars', 'Brakes'],
  'Hybrid': ['Frame', 'Wheels', 'Handlebars', 'Brakes', 'Saddle'],
  'BMX': ['Frame', 'Wheels', 'Handlebars', 'Brakes'],
  'Electric': ['Frame', 'Wheels', 'Brakes', 'Saddle'],
  'Cruiser': ['Frame', 'Wheels', 'Handlebars', 'Saddle'],
  'Gravel': ['Frame', 'Wheels', 'Handlebars', 'Brakes'],
  'Track': ['Frame', 'Wheels', 'Handlebars']
};

const getRecommendations = async (req, res) => {
  try {
    const userId = req.user.id;
    const preference = req.user.preference || 'Road Bike';
    const categories = preferenceMap[preference] || ['Frame', 'Wheels', 'Handlebars', 'Brakes'];

    // check what the user has ordered before
    const userOrders = await Order.findAll({ where: { userId } });
    const orderIds = userOrders.map(o => o.id);

    let historyCategories = [];
    if (orderIds.length > 0) {
      const historyItems = await OrderItem.findAll({
        where: { orderId: { [Op.in]: orderIds } },
        include: [{ model: Component }]
      });
      historyCategories = [...new Set(historyItems.map(i => i.Component.category))];
    }

    // prefer categories from past orders, otherwise use the preference list
    const targetCategories = historyCategories.length > 0 ? historyCategories : categories;

    // grab in-stock parts from those categories
    const components = await Component.findAll({
      where: {
        category: { [Op.in]: targetCategories },
        stockQuantity: { [Op.gt]: 0 }
      },
      limit: 4,
      order: orderIds.length > 0 ? ['stockQuantity', 'DESC'] : sequelize.random()
    });

    let recommendations = [...components];

    // if we didn't get enough, fill the remaining slots with any available parts
    if (recommendations.length < 4) {
      const fallback = await Component.findAll({
        where: {
          stockQuantity: { [Op.gt]: 0 },
          id: { [Op.notIn]: recommendations.map(c => c.id) }
        },
        limit: 4 - recommendations.length,
        order: sequelize.random()
      });
      recommendations = [...recommendations, ...fallback];
    }

    //  if still nothing, just return any components.
    if (recommendations.length === 0) {
      recommendations = await Component.findAll({
        limit: 4,
        order: sequelize.random()
      });
    }

    res.status(200).json(recommendations);
  } catch (error) {
    console.error('Recommendation error:', error);
    // try to send random parts if the main logic fails
    try {
      const fallback = await Component.findAll({ limit: 4, order: sequelize.random() });
      res.status(200).json(fallback);
    } catch (e) {
      res.status(500).json({ error: 'Could not load recommendations' });
    }
  }
};

module.exports = { getRecommendations };