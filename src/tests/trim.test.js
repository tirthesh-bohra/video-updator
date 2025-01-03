const request = require('supertest');
const makeApp = require('./dummy/app');

describe('POST /trim', () => {

    let app, context;
    const token = 'jahkgvfkjav';

    beforeAll(async () => {
        const {app: ap1, context: con1} = await makeApp();
        app = ap1, context = con1;
    });

    beforeEach(() => {
      jest.restoreAllMocks();
    });
  
    it('should successfully trim the video', async () => {
      const videoId = '123';
      jest.spyOn(context.dal, 'get').mockResolvedValue({
        filename: 'example.mp4',
        duration: 300,
      });
      jest.spyOn(context.VideoService, 'trimVideo').mockResolvedValue({
        outputPath: '/processed/trimmed-example.mp4',
      });
  
      const response = await request(app)
        .post('/api/trim')
        .set('Authorization', token).send({ videoId, startTime: 30, endTime: 120 });
  
      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        originalVideo: videoId,
        duration: 90,
        outputPath: '/processed/trimmed-example.mp4',
      });
    });
  
    it('should return 400 if parameters are missing', async () => {
      const response = await request(app).post('/api/trim').set('Authorization', token).send({});
  
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid parameters. Required: videoId, startTime, endTime');
    });
  
    it('should return 400 if startTime or endTime is invalid', async () => {
      const response = await request(app)
        .post('/api/trim')
        .set('Authorization', token).send({ videoId: '123', startTime: -5, endTime: 50 });
  
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid time range');
    });
  
    it('should return 404 if the video is not found', async () => {
      jest.spyOn(context.dal, 'get').mockResolvedValue(null);
  
      const response = await request(app)
        .post('/api/trim')
        .set('Authorization', token).send({ videoId: '123', startTime: 10, endTime: 50 });
  
      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Video not found');
    });
  
    it('should return 400 if endTime exceeds video duration', async () => {
      jest.spyOn(context.dal, 'get').mockResolvedValue({
        filename: 'example.mp4',
        duration: 100,
      });
  
      const response = await request(app)
        .post('/api/trim')
        .set('Authorization', token).send({ videoId: '123', startTime: 10, endTime: 120 });
  
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('End time exceeds video duration');
    });
  
    it('should return 400 if the trim service fails', async () => {
      jest.spyOn(context.dal, 'get').mockResolvedValue({
        filename: 'example.mp4',
        duration: 300,
      });
      jest.spyOn(context.VideoService, 'trimVideo').mockRejectedValue(new Error('Trim service error'));
  
      const response = await request(app)
        .post('/api/trim')
        .set('Authorization', token).send({ videoId: '123', startTime: 30, endTime: 120 });
  
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Trim service error');
    });
  
    it('should return 404 if the video file path is invalid', async () => {
      jest.spyOn(context.dal, 'get').mockResolvedValue({
        filename: null,
        duration: 300,
      });
  
      const response = await request(app)
        .post('/api/trim')
        .set('Authorization', token).send({ videoId: '123', startTime: 30, endTime: 120 });
  
      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Video not found');
    });
});
  