const appBuilder = require('./src/express/index.js');
const db = require('./src/config/database.js');
require('dotenv').config();

const context = {dal: db()};
const app = appBuilder(context);

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Video Mutator Started at Port ${port}`);
});
