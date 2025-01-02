module.exports = (context) => ({
    auth: true,
    route: '/limits',
    method: 'put',
    resolver: async (req, res) => {
      try {
        const { maxDuration, minDuration, maxSize } = req.body;
  
        if (maxDuration && typeof maxDuration !== 'number' || maxDuration <= 0) {
          return res.status(400).json({ error: 'Invalid maxDuration' });
        }
  
        if (minDuration && typeof minDuration !== 'number' || minDuration <= 0) {
          return res.status(400).json({ error: 'Invalid minDuration' });
        }
  
        if (maxDuration && minDuration && maxDuration <= minDuration) {
          return res.status(400).json({ 
            error: 'maxDuration must be greater than minDuration' 
          });
        }
  
        if (maxSize && typeof maxSize !== 'number' || maxSize <= 0) {
          return res.status(400).json({ error: 'Invalid maxSize' });
        }
  
        const newLimits = await context.VideoService.updateLimits({
          maxDuration,
          minDuration,
          maxSize
        });
        
        res.json({ 
          success: true, 
          limits: newLimits,
          updatedAt: new Date().toISOString()
        });
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    }
  });