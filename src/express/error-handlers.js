class AppError extends Error {
    constructor(statusCode, message) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    }
}

const handleNotFound = (req, res, next) => {
    next(new AppError(404, `Route ${req.originalUrl} not found`));
};

const handleErrors = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    console.error('ERROR 💥', {
        status: err.status,
        error: err,
        message: err.message,
        stack: err.stack
    });

    res.status(err.statusCode).json({
        status: err.status,
        message: err.message
    });
};

module.exports = {
    AppError,
    handleNotFound,
    handleErrors
};