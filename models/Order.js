// This file defines the Order model. It stores order details, total price, and shipping information.

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('Order', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    status: { type: DataTypes.STRING, allowNull: false, defaultValue: 'pending' },
    totalPrice: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
    shippingProvince: { type: DataTypes.STRING, allowNull: true },
    shippingCity: { type: DataTypes.STRING, allowNull: true },
    shippingPostcode: { type: DataTypes.STRING, allowNull: true },
    shippingAddress: { type: DataTypes.STRING, allowNull: true },
    hiddenFromCustomer: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false }
  }, {
    tableName: 'Orders',
    timestamps: true
  });
};