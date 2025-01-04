const request = require('supertest');
const makeApp = require('../dummy/app');

describe('POST /merge', () => {

    let app, context;
    const token = 'jahkgvfkjav';

    beforeAll(async () => {
        const {app: ap1, context: con1} = await makeApp();
        app = ap1, context = con1;
    });

    beforeEach(() => {
      jest.restoreAllMocks();
    });
  
    it('should successfully merge videos', async () => {
      const videoIds = ['vid1', 'vid2'];
      jest.spyOn(context.dal, 'all').mockResolvedValue([
        { id: 'vid1', filename: 'video1.mp4', duration: 120 },
        { id: 'vid2', filename: 'video2.mp4', duration: 180 },
      ]);
      jest.spyOn(context.VideoService, 'mergeVideos').mockResolvedValue({
        mergedVideoPath: '/processed/merged-video.mp4',
      });
  
      const response = await request(app).post('/api/merge').set('Authorization', token).send({ videoIds });
  
      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        sourceVideos: videoIds,
        totalDuration: 300,
        filename: expect.stringContaining('merged-'),
        mergedVideoPath: '/processed/merged-video.mp4',
      });
    });
  
    it('should return 400 if video IDs are missing or insufficient', async () => {
      const response = await request(app).post('/api/merge').set('Authorization', token).send({ videoIds: ['vid1'] });
  
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('At least two video IDs are required for merging');
    });
  
    it('should return 404 if one or more videos are not found', async () => {
      const videoIds = ['vid1', 'vid2'];
      jest.spyOn(context.dal, 'all').mockResolvedValue([
        { id: 'vid1', filename: 'video1.mp4', duration: 120 },
        null,
      ]);
  
      const response = await request(app).post('/api/merge').set('Authorization', token).send({ videoIds });
  
      expect(response.status).toBe(404);
      expect(response.body.error).toBe('One or more videos not found');
    });
  
    it('should return 400 if the merge service fails', async () => {
      const videoIds = ['vid1', 'vid2'];
      jest.spyOn(context.dal, 'all').mockResolvedValue([
        { id: 'vid1', filename: 'video1.mp4', duration: 120 },
        { id: 'vid2', filename: 'video2.mp4', duration: 180 },
      ]);
      jest.spyOn(context.VideoService, 'mergeVideos').mockRejectedValue(
        new Error('Merge service error')
      );
  
      const response = await request(app).post('/api/merge').set('Authorization', token).send({ videoIds });
  
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Merge service error');
    });
  
    it('should return 400 if the database query fails', async () => {
      const videoIds = ['vid1', 'vid2'];
      jest.spyOn(context.dal, 'all').mockRejectedValue(new Error('Database query failed'));
  
      const response = await request(app).post('/api/merge').set('Authorization', token).send({ videoIds });
  
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Database query failed');
    });
  
    it('should return 404 if video file paths are invalid or null', async () => {
      const videoIds = ['vid1', 'vid2'];
      jest.spyOn(context.dal, 'all').mockResolvedValue([
        { id: 'vid1', filename: null, duration: 120 },
        { id: 'vid2', filename: 'video2.mp4', duration: 180 },
      ]);
  
      const response = await request(app).post('/api/merge').set('Authorization', token).send({ videoIds });
  
      expect(response.status).toBe(404);
      expect(response.body.error).toBe('One or more videos not found');
    });
  
    it('should return 400 if request body is invalid', async () => {
      const response = await request(app).post('/api/merge').set('Authorization', token).send({});
  
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('At least two video IDs are required for merging');
    });
});
  