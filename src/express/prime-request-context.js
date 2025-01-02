const { nanoid } = require('nanoid');

module.exports = (req, _, next) => {
  req.context = { traceId: nanoid() };
  next();
};
