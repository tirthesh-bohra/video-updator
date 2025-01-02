const fs = require('fs').promises;
const path = require('path');
const { Router } = require('express');
const authFactory = require('./auth-wrapper');

async function getRouters() {
    const resolversPath = path.join(__dirname, '..', 'resolvers');
    const files = await fs.readdir(resolversPath);
    
    const routers = [];
    for (const file of files) {
        const filePath = path.join(resolversPath, file);
        const stat = await fs.stat(filePath);
        
        if (stat.isFile() && file.endsWith('.js')) {
            routers.push(require(filePath));
        }
    }
    
    return routers;
}

module.exports = async (app, context) => {
    const router = Router();
    const routerBuilders = await getRouters();
    const authMiddleware = authFactory(context);

    router.get('/health', (req, res) => {
        res.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            uptime: process.uptime()
        });
    });

    for (const builder of routerBuilders) {
        const route = builder(context);
        const handlers = [route.resolver];

        if (route.auth) {
            handlers.unshift(authMiddleware);
        }

        if (route.method === 'post' && route.route === '/upload') {
            handlers.unshift(context.upload.single('video'));
        }

        handlers.push(async (req, res, next) => {
            try {
                await route.resolver(req, res, next);
            } catch (error) {
                next(error);
            }
        });

        router[route.method.toLowerCase()](route.route, ...handlers);
    }

    app.use('/api', router);
};