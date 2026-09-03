// This file sets up the database connection and defines relationships between models.

const { Sequelize } = require('sequelize');

// Detect Neon database, which is what is being used for Custom Bicycle Building System.
const isCloud = process.env.DATABASE_URL.includes('neon.tech') || process.env.NODE_ENV === 'production';

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
  dialectOptions: {
    ssl: isCloud ? { require: true, rejectUnauthorized: false } : false
  }
});


// Load all models
const User = require('./User')(sequelize);
const Component = require('./Component')(sequelize);
const Compatibility = require('./Compatibility')(sequelize);
const Order = require('./Order')(sequelize);
const OrderItem = require('./OrderItem')(sequelize);
const Cart = require('./Cart')(sequelize);
const CartItem = require('./CartItem')(sequelize);


// user and order
User.hasMany(Order, { foreignKey: 'userId' });
Order.belongsTo(User, { foreignKey: 'userId' });


// user and cart
User.hasMany(Cart, { foreignKey: 'userId' });
Cart.belongsTo(User, { foreignKey: 'userId' });


// order and order items
Order.hasMany(OrderItem, { foreignKey: 'orderId' });
OrderItem.belongsTo(Order, { foreignKey: 'orderId' });


// components in orders
Component.hasMany(OrderItem, { foreignKey: 'componentId' });
OrderItem.belongsTo(Component, { foreignKey: 'componentId' });


// compatibility rules between components
Compatibility.belongsTo(Component, { as: 'ComponentA', foreignKey: 'componentAId' });
Compatibility.belongsTo(Component, { as: 'ComponentB', foreignKey: 'componentBId' });


// cart and cart items
Cart.hasMany(CartItem, { 
  foreignKey: 'cartId', 
  as: 'CartItems',
  onDelete: 'CASCADE'
});
CartItem.belongsTo(Cart, { foreignKey: 'cartId' });


// components in carts
Component.hasMany(CartItem, { foreignKey: 'componentId' });
CartItem.belongsTo(Component, { foreignKey: 'componentId' });


module.exports = { sequelize, User, Component, Compatibility, Order, OrderItem, Cart, CartItem };