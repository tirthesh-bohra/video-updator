module.exports = (context) => {
    const tokens = new Set(process.env.TOKENS.split(','));
    return (req, res, next) => {
        if (tokens.has(req.headers['x-access-token'])) return next();

        return res.status(401).json({ error: 'Invalid API token' });
    }
}