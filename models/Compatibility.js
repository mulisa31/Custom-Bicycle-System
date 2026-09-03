// This file defines the Compatibility model. It says whether two components can be used together.

const { DataTypes } = require('sequelize');
module.exports = (sequelize) => {
  return sequelize.define('Compatibility', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    componentAId: { type: DataTypes.INTEGER, allowNull: false },
    componentBId: { type: DataTypes.INTEGER, allowNull: false },
    compatible: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true }
  });
};