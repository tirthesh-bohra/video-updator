const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const mountRoutes = require('./mount-routes');
const mountMiddlewares = require('./mount-middlewares');

module.exports = (config) => {
    const app = express();
    config.upload = multer();
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));
    mountRoutes(app, config);
    mountMiddlewares(app);

    return app;
};