const { AppError } = require('./error-handlers');

module.exports = (context) => {
    const tokens = new Set(process.env.TOKENS.split(','));
    return (req, res, next) => {
        if (tokens.has(req.headers.authorization)) return next();

        throw new AppError(401, 'Invalid or expired token');
    }
}