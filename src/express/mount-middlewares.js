const primeRequestContext = require('./prime-request-context.js');

module.exports = (app) => {
  app.use(primeRequestContext);
};
