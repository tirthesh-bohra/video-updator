const request = require('supertest');
const makeApp = require('./dummy/app');
const { Readable } = require('stream');

describe('GET /view/:shareId', () => {

    let app, context;
    const token = 'jahkgvfkjav';

    beforeAll(async () => {
        const {app: ap1, context: con1} = await makeApp();
        app = ap1, context = con1;
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });
   
    it('should return video for valid and non-expired share link', async () => {
        const shareId = 'valid-share-id';
        const videoId = 'vid123';
        const filename = 'video.mp4';
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 48);
    
        const mockStream = new Readable({
          read() {
            this.push(null);
          }
        });
    
        jest.spyOn(context.dal, 'get')
          .mockResolvedValueOnce({ video_id: videoId, expires_at: expiresAt.toISOString() })
          .mockResolvedValueOnce({ id: videoId, filename, duration: 120 });
    
        jest.spyOn(context.VideoService, 'streamFile')
          .mockResolvedValue(mockStream);
    
        const response = await request(app)
          .get(`/api/view/${shareId}`)
          .set('Authorization', token);
    
        expect(response.status).toBe(200);
        expect(response.headers['content-type']).toBe('video/mp4');
        expect(response.headers['content-disposition']).toBe(`inline; filename="${filename}"`);
      });
      
    it('should return 404 if the shared link does not exist', async () => {
        const shareId = 'invalid-share-id';
        
        jest.spyOn(context.dal, 'get').mockResolvedValueOnce(null);
        
        const response = await request(app).get(`/api/view/${shareId}`).set('Authorization', token);
        
        expect(response.status).toBe(404);
        expect(response.body.error).toBe('Shared link not found');
        
        jest.restoreAllMocks();
    });

    it('should return 410 if the shared link has expired', async () => {
        const shareId = 'expired-share-id';
        const videoId = 'vid123';
        const filename = 'video.mp4';
        const expiredAt = new Date();
        expiredAt.setHours(expiredAt.getHours() - 1);
        
        jest.spyOn(context.dal, 'get').mockResolvedValueOnce({ video_id: videoId, expires_at: expiredAt.toISOString() });
        jest.spyOn(context.dal, 'run').mockResolvedValue();
        jest.spyOn(context.dal, 'get').mockResolvedValueOnce({ id: videoId, filename, duration: 120 });
        
        const response = await request(app).get(`/api/view/${shareId}`).set('Authorization', token);
        
        expect(response.status).toBe(410);
        expect(response.body.error).toBe('Shared link has expired');
        
        jest.restoreAllMocks();
    });

    it('should return 404 if the video associated with the shared link is not found', async () => {
        const shareId = 'valid-share-id';
        const videoId = 'vid123';
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 48);

        jest.spyOn(context.dal, 'get').mockResolvedValueOnce({ video_id: videoId, expires_at: expiresAt.toISOString() });
        jest.spyOn(context.dal, 'get').mockResolvedValueOnce(null);
        
        const response = await request(app).get(`/api/view/${shareId}`).set('Authorization', token);
        
        expect(response.status).toBe(404);
        expect(response.body.error).toBe('Video not found');

        jest.restoreAllMocks();
    });

    it('should return 500 if video streaming fails', async () => {
        const shareId = 'valid-share-id';
        const videoId = 'vid123';
        const filename = 'video.mp4';
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 48);

        jest.spyOn(context.dal, 'get')
            .mockResolvedValueOnce({ video_id: videoId, expires_at: expiresAt.toISOString() })
            .mockResolvedValueOnce({ id: videoId, filename, duration: 120 });

        jest.spyOn(context.VideoService, 'streamFile')
            .mockRejectedValue(new Error('Failed to stream video'));

        const response = await request(app)
            .get(`/api/view/${shareId}`)
            .set('Authorization', token);

        expect(response.status).toBe(500);
        expect(response.body.error).toBe('Failed to stream video');
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });
});
  