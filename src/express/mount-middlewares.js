const lastResortErrorHandler = require('./last-resort-error-handler.js');
const primeRequestContext = require('./prime-request-context.js');

module.exports = (app) => {
  app.use(primeRequestContext);
  app.use(lastResortErrorHandler);
};
