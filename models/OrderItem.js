// This file defines the OrderItem model. It stores components that belong to an order.
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('OrderItem', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    orderId: { type: DataTypes.INTEGER, allowNull: false },
    bicycleGroupId: { type: DataTypes.UUID, allowNull: false, defaultValue: DataTypes.UUIDV4 },
    componentId: { type: DataTypes.INTEGER, allowNull: false },
    quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    compatibilityChecked: { type: DataTypes.BOOLEAN, defaultValue: false }
  }, {
    tableName: 'OrderItems',
    timestamps: true
  });
};