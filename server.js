const appBuilder = require('./src/express/index.js');
const db = require('./src/config/database.js');
const VService = require('./src/services/video.js');
const constants = require('./src/config/constants.js');
require('dotenv').config();

const limits = {
    maxDuration: Number(constants.STORAGE_CONFIG.MAX_VIDEO_DURATION),
    maxSize: Number(constants.STORAGE_CONFIG.MAX_VIDEO_SIZE),
    minDuration: Number(constants.STORAGE_CONFIG.MIN_VIDEO_DURATION),
};

const port = process.env.PORT || 3000;

async function startServer() {
    const VideoService = new VService(limits, constants.STORAGE_CONFIG);
    await VideoService.initialize();

    try {
        const context = {
            dal: await db(),
            VideoService
        };

        const app = await appBuilder(context);
        
        const server = app.listen(port, () => {
            console.log(`Video Mutator Started at Port ${port}`);
        });

        const shutdown = async (signal) => {
            console.log(`${signal} received. Starting graceful shutdown...`);
            
            server.close(async () => {
                console.log('HTTP server closed');
                try {
                    await context.dal.close();
                    console.log('Cleanup completed');
                    process.exit(0);
                } catch (error) {
                    console.error('Error during cleanup:', error);
                    process.exit(1);
                }
            });
        };

        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGINT', () => shutdown('SIGINT'));

        return server;
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

module.exports = startServer;

if (require.main === module) {
    startServer();
}