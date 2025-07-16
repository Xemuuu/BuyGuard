const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const User = sequelize.define('User', {
  email: { type: DataTypes.STRING, unique: true },
  password_hash: DataTypes.STRING,
  role: DataTypes.ENUM('admin', 'manager', 'user')
});

module.exports = User;
