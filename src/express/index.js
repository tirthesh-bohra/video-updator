const express = require('express');
const bodyParser = require('body-parser');
const mountRoutes = require('./mount-routes');
const mountMiddlewares = require('./mount-middlewares');

module.exports = (context) => {
    const app = express();
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));
    mountRoutes(app, context);
    mountMiddlewares(app);

    return app;
};