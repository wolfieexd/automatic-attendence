const { Sequelize } = require('sequelize');
const path = require('path');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '../database.sqlite'),
  logging: false // Disable logging for cleaner console
});

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('SQLite Database Connected Successfully');
  } catch (error) {
    console.error('SQLite connection error:', error.message);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };