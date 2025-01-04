const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const path = require('path');
const mountRoutes = require('./mount-routes');
const mountMiddlewares = require('./mount-middlewares');
const { handleNotFound, handleErrors } = require('./error-handlers');

module.exports = async (context) => {
    const app = express();

    app.use(helmet());
    app.use(cors({
        origin: process.env.CORS_ORIGIN || '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        allowedHeaders: ['Content-Type', 'Authorization']
    }));

    app.use(rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 100,
        message: 'Too many requests from this IP, please try again later'
    }));

    app.use(morgan('combined'));

    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    const storage = multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, context.VideoService.config.UPLOAD_DIR);
        },
        filename: (req, file, cb) => {
            const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
            cb(null, `${uniqueSuffix}-${file.originalname}`);
        }
    });

    const fileFilter = (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        if (context.VideoService.config.ALLOWED_TYPES.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error(`Unsupported file type. Allowed types: ${context.VideoService.config.ALLOWED_TYPES.join(', ')}`));
        }
    };

    const upload = multer({
        storage,
        fileFilter,
        limits: {
            fileSize: context.VideoService.maxSize
        }
    });

    context.upload = upload;

    mountMiddlewares(app);
    await mountRoutes(app, context);

    app.use(handleNotFound);
    app.use(handleErrors);

    return app;
};