// This file defines the Cart model. It stores a user's active cart and its status.

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('Cart', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    status: { type: DataTypes.STRING, allowNull: false, defaultValue: 'active' }
  }, {
    tableName: 'Carts',
    timestamps: true
  });
};