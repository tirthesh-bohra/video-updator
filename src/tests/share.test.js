const request = require('supertest');
const makeApp = require('./dummy/app');

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-share-id')
}));

describe('POST /share', () => {

    let app, context;
    const token = 'jahkgvfkjav';

    beforeAll(async () => {
        const {app: ap1, context: con1} = await makeApp();
        app = ap1, context = con1;
    });

    beforeEach(() => {
        jest.useFakeTimers();
        const mockDate = new Date('2025-01-04T21:28:36.823Z');
        jest.setSystemTime(mockDate);
        jest.restoreAllMocks();
    });

    afterEach(() => {
        jest.useRealTimers();
    });
  
    it('should successfully generate a share link', async () => {
        const videoId = 'vid123';
        const expiryHours = 48;
        const shareId = 'mock-share-id';
        const expiresAt = new Date('2025-01-04T21:28:36.823Z');
        expiresAt.setHours(expiresAt.getHours() + expiryHours);
    
        jest.spyOn(context.dal, 'get').mockResolvedValue({ id: videoId });
        jest.spyOn(context.dal, 'run').mockResolvedValue();
    
        const response = await request(app)
          .post('/api/share')
          .set('Authorization', token)
          .send({ videoId, expiryHours });
    
        expect(response.status).toBe(200);
        expect(response.body).toMatchObject({
          shareId,
          shareUrl: expect.stringContaining(`/api/view/${shareId}`),
          videoId,
          expiresAt: expiresAt.toISOString(),
          validForHours: expiryHours,
        });
    });
  
    it('should return 400 if videoId is missing', async () => {
      const response = await request(app).post('/api/share').set('Authorization', token).send({});
  
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid parameters. Required: videoId, optional: expiryHours (positive number)');
    });
  
    it('should return 400 if expiryHours is invalid', async () => {
      const response = await request(app).post('/api/share').set('Authorization', token).send({ videoId: 'vid123', expiryHours: -5 });
  
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid parameters. Required: videoId, optional: expiryHours (positive number)');
    });
  
    it('should return 404 if the video does not exist', async () => {
      jest.spyOn(context.dal, 'get').mockResolvedValue(null);
  
      const response = await request(app).post('/api/share').set('Authorization', token).send({ videoId: 'vid123', expiryHours: 24 });
  
      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Video not found');
    });
  
    it('should return 400 if database insertion fails', async () => {
      const videoId = 'vid123';
      jest.spyOn(context.dal, 'get').mockResolvedValue({ id: videoId });
      jest.spyOn(context.dal, 'run').mockRejectedValue(new Error('Database error'));
  
      const response = await request(app).post('/api/share').set('Authorization', token).send({ videoId, expiryHours: 24 });
  
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Database error');
    });
  
    it('should use default expiryHours when not provided', async () => {
        const videoId = 'vid123';
        const defaultExpiryHours = 24;
        const shareId = 'mock-share-id';

        const expiresAt = new Date('2025-01-04T21:28:36.823Z');
        expiresAt.setHours(expiresAt.getHours() + defaultExpiryHours);
    
        jest.spyOn(context.dal, 'get').mockResolvedValue({ id: videoId });
        jest.spyOn(context.dal, 'run').mockResolvedValue();
    
        const response = await request(app)
          .post('/api/share')
          .set('Authorization', token)
          .send({ videoId });
    
        expect(response.status).toBe(200);
        expect(response.body).toMatchObject({
          shareId,
          expiresAt: expiresAt.toISOString(),
          validForHours: defaultExpiryHours,
        });
    });
  
    it('should return 400 for invalid request body', async () => {
      const response = await request(app).post('/api/share').set('Authorization', token).send({ expiryHours: 24 });
  
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid parameters. Required: videoId, optional: expiryHours (positive number)');
    });
});
  