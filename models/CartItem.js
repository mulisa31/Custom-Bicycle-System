// This file defines the CartItem model. Each row is one component inside a user's cart.

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('CartItem', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    cartId: { type: DataTypes.INTEGER, allowNull: false },
    bicycleGroupId: { type: DataTypes.UUID, allowNull: false, defaultValue: DataTypes.UUIDV4 },
    componentId: { type: DataTypes.INTEGER, allowNull: false },
    quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 }
  }, {
    tableName: 'CartItems',
    timestamps: true
  });
};