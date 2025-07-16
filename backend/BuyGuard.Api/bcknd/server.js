require('dotenv').config();
const express = require('express');
const app = express();
const authRoutes = require('./routes/authRoutes');
const sequelize = require('./db');

app.use(express.json());
app.use('/auth', authRoutes);

sequelize.authenticate()
  .then(() => console.log('Połączono z bazą'))
  .catch(err => console.error('Błąd bazy:', err));

app.listen(3000, () => console.log('Serwer działa na http://localhost:3000'));
