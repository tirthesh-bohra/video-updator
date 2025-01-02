const appBuilder = require('./src/express/index.js');
require('dotenv').config();

const config = {};
const app = appBuilder(config);

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Video Mutator Started at Port ${port}`);
});
