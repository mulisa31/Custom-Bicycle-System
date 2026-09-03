// This file defines the Component model. It stores details about each bike part.

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('Component', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    category: { type: DataTypes.STRING, allowNull: false, defaultValue: 'General' },
    unitPrice: { type: DataTypes.FLOAT, allowNull: false },
    stockQuantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    image_url: { type: DataTypes.STRING, allowNull: true } 
  });
};