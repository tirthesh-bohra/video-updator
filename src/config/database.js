const DatabaseManager = require('./manager');

let dbManager = null;
const getDatabase = async () => {
  if (!dbManager) {
    dbManager = new DatabaseManager();
    await dbManager.initialize();
  }
  return dbManager.getDatabase();
};

process.on('SIGINT', async () => {
  if (dbManager) {
    try {
      await dbManager.close();
      console.log('Database connection closed');
      process.exit(0);
    } catch (err) {
      console.error('Error closing database:', err);
      process.exit(1);
    }
  }
});

module.exports = getDatabase;