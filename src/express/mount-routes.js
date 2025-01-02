const fs = require('fs');
const path = require('path');
const authFactory = require('./auth-wrapper');
const lastResortErrorHandler = require('./last-resort-error-handler');

function getRouters() {
    const resolversPath = path.join(__dirname, '..', 'resolvers');
    const files = fs.readdirSync(resolversPath);
    return files.map((file) => {
        const filePath = path.join(resolversPath, file);
        if(!(fs.statSync(filePath).isFile() && filePath.endsWith('.js'))) return [];
          return require(filePath);
      });
}

module.exports = (app, context) => {
    const routerBuilders = getRouters();
    const authMiddleware = authFactory(context);

    for(const builders of routerBuilders) {
        const r = builders(context);
        if(r.auth) {
            app.route(r.route)[r.method](authMiddleware, async (req, res, next) => {
                try {
                    await r.resolver(req, res, next);
                } catch (error) {
                    next(error);
                }
            });
        } else {
            app.route(r.route)[r.method](async (req, res, next) => {
                try {
                    await r.resolver(req, res, next);
                } catch (error) {
                    next(error);
                }
            });
        }
    }

    app.get('/', (req, res) => res.send('Health Check OK'));
    app.use(lastResortErrorHandler);
}
