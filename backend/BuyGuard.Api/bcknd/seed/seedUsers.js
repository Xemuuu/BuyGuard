const bcrypt = require('bcryptjs');
const User = require('../models/User');
const sequelize = require('../db');

const seedUsers = async () => {
  await sequelize.sync({ force: true });

  await User.bulkCreate([
    {
      email: 'admin@example.com',
      password_hash: await bcrypt.hash('admin123', 10),
      role: 'admin'
    },
    {
      email: 'manager@example.com',
      password_hash: await bcrypt.hash('manager123', 10),
      role: 'manager'
    },
    {
      email: 'user@example.com',
      password_hash: await bcrypt.hash('user123', 10),
      role: 'user'
    }
  ]);

  console.log('Seed complete');
};

seedUsers();
