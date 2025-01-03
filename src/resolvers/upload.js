const { v4: uuidv4 } = require('uuid');
const path = require('path');

module.exports = (context) => ({
  auth: true,
  route: '/upload',
  method: 'post',
  resolver: async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const metadata = await context.VideoService.validateVideo(req.file.path);
      const videoId = uuidv4();
      const { filename } = await context.VideoService.saveFile(req.file);

      await context.dal.run(
        'INSERT INTO videos (id, filename, size, duration) VALUES (?, ?, ?, ?)',
        [videoId, filename, metadata.size, metadata.duration]
      );
      
      res.json({ 
        id: videoId, 
        filename,
        ...metadata,
        uploadedAt: new Date().toISOString()
      });
    } catch (error) {
      await context.VideoService.cleanup();
      res.status(400).json({ error: error.message });
    }
  }
});