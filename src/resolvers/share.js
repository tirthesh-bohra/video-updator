const { v4: uuidv4 } = require('uuid');

module.exports = (context) => ({
    auth: true,
    route: '/share',
    method: 'get',
    resolver: async (req, res) => {
      try {
        const { videoId, expiryHours = 24 } = req.body;
  
        if (!videoId || typeof expiryHours !== 'number' || expiryHours <= 0 && expiryHours < 72) {
          return res.status(400).json({ 
            error: 'Invalid parameters. Required: videoId, optional: expiryHours (positive number)' 
          });
        }

        const video = await context.dal.get(
          'SELECT id FROM videos WHERE id = ?',
          [videoId]
        );
  
        if (!video) {
          return res.status(404).json({ error: 'Video not found' });
        }
  
        const shareId = uuidv4();
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + expiryHours);
        
        await context.dal.run(
          'INSERT INTO shared_links (id, video_id, expires_at) VALUES (?, ?, ?)',
          [shareId, videoId, expiresAt.toISOString()]
        );
        
        const shareUrl = new URL(
          `/api/view/${shareId}`,
          `${req.protocol}://${req.get('host')}`
        ).toString();
  
        res.json({
          shareId,
          shareUrl,
          videoId,
          expiresAt: expiresAt.toISOString(),
          validForHours: expiryHours
        });
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    }
  });