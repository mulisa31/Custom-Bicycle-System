// This file generates reports for the manager dashboard: stock levels, most ordered parts, and daily sales.

const { Component, Order, OrderItem, sequelize } = require('../models');

// list all components with stock info, sorted by lowest stock first
const getStockReport = async (req, res) => {
  try {
    const stock = await Component.findAll({
      attributes: ['id', 'name', 'category', 'stockQuantity', 'unitPrice'],
      order: [['stockQuantity', 'ASC']]
    });
    res.status(200).json(stock);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// show the top 10 most ordered components
const getPopularityReport = async (req, res) => {
  try {
    const popularity = await OrderItem.findAll({
      attributes: [
        'componentId',
        [sequelize.fn('SUM', sequelize.col('quantity')), 'totalOrdered']
      ],
      include: [{ model: Component, attributes: ['id', 'name', 'category'] }],
      group: ['componentId', 'Component.id', 'Component.name', 'Component.category'],
      order: [[sequelize.fn('SUM', sequelize.col('quantity')), 'DESC']],
      limit: 10
    });
    res.status(200).json(popularity);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// group sales by date and show total orders + revenue for each day
const getSalesReport = async (req, res) => {
  try {
    const sales = await Order.findAll({
      attributes: [
        [sequelize.fn('DATE', sequelize.col('createdAt')), 'date'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalOrders'],
        [sequelize.fn('SUM', sequelize.col('totalPrice')), 'totalRevenue']
      ],
      group: [sequelize.fn('DATE', sequelize.col('createdAt'))],
      order: [[sequelize.fn('DATE', sequelize.col('createdAt')), 'ASC']],
      where: { status: ['ready', 'shipped', 'completed'] }
    });
    res.status(200).json(sales);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getStockReport, getPopularityReport, getSalesReport };