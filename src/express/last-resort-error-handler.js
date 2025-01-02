/***
 * When nothing else catches an error, this function catches and logs it
 */
module.exports = (err, req, res, next) => {
    const traceId = req.context.traceId;
    console.error("Unhandled error: ", { traceId, err });

    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    res.status(statusCode).json({
        error: message,
    });
};
