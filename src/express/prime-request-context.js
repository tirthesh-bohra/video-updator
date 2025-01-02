const { v4 } = require('uuid');

module.exports = (req, _, next) => {
  req.context = { traceId: v4() };
  next();
};
