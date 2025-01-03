const appBuilder = require('../../express/index');
const db = require('../../config/database');
const VService = require('../../services/video');
const { STORAGE_CONFIG } = require('../../config/constants');

const limits = {
    maxDuration: Number(STORAGE_CONFIG.MAX_VIDEO_DURATION),
    maxSize: Number(STORAGE_CONFIG.MAX_VIDEO_SIZE),
    minDuration: Number(STORAGE_CONFIG.MIN_VIDEO_DURATION),
};

async function makeApp() {
    const VideoService = new VService(limits, STORAGE_CONFIG);
    await VideoService.initialize();

    const context = {
        dal: await db(),
        VideoService
    }

    const app = await appBuilder(context);

    return {app, context};
}

module.exports = makeApp;





