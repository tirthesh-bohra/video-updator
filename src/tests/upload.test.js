const request = require('supertest');
const makeApp = require('./dummy/app');

describe('POST /upload', () => {

    let app, context;
    const token = 'jahkgvfkjav';

    beforeAll(async () => {
        const {app: ap1, context: con1} = await makeApp();
        app = ap1, context = con1;
    });

    const mockFile = {
        originalname: 'video.mp4',
        path: '/temp/uploaded-video.mp4',
    };
    
    const mockMetadata = {
        size: 5000000,
        duration: 120,
    };
    
    beforeEach(() => {
        jest.restoreAllMocks();
    });
    
    it('should upload the video successfully', async () => {
        jest.spyOn(context.VideoService, 'validateVideo').mockResolvedValue(mockMetadata);
        jest.spyOn(context.VideoService, 'saveFile').mockResolvedValue({ filename: 'video.mp4' });
        jest.spyOn(context.dal, 'run').mockResolvedValue();
    
        const response = await request(app)
        .post('/api/upload').set('Authorization', token)
        .attach('video', Buffer.from('dummy data'), mockFile.originalname);
    
        expect(response.status).toBe(200);
        expect(response.body).toMatchObject({
        id: expect.any(String),
        filename: 'video.mp4',
        size: mockMetadata.size,
        duration: mockMetadata.duration,
        uploadedAt: expect.any(String),
        });
    });
    
    it('should return 400 if no file is uploaded', async () => {
        const response = await request(app).post('/api/upload').set('Authorization', token);
    
        expect(response.status).toBe(400);
        expect(response.body.error).toBe('No file uploaded');
    });
    
    it('should return 400 for an invalid file type', async () => {
        const invalidFile = { ...mockFile, originalname: 'video.txt' };
        Object.defineProperty(context.VideoService.config, 'ALLOWED_TYPES', {
            value: ['.mp4', '.avi', '.mov'],
            writable: true,
        });
    
        const response = await request(app)
        .post('/api/upload').set('Authorization', token)
        .attach('video', Buffer.from('dummy data'), invalidFile.originalname);
    
        expect(response.status).toBe(500);
        expect(response._body.message).toContain('Unsupported file type');
    });
    
    it('should return 400 if video validation fails', async () => {
        jest.spyOn(context.VideoService, 'validateVideo').mockRejectedValue(new Error('Invalid video file'));
    
        const response = await request(app)
        .post('/api/upload').set('Authorization', token)
        .attach('video', Buffer.from('dummy data'), mockFile.originalname);
    
        expect(response.status).toBe(400);
        expect(response.body.error).toBe('Invalid video file');
    });
    
    it('should return 500 if there is a database error during video insertion', async () => {
        jest.spyOn(context.VideoService, 'validateVideo').mockResolvedValue(mockMetadata);
        jest.spyOn(context.VideoService, 'saveFile').mockResolvedValue({ filename: 'video.mp4' });
        jest.spyOn(context.dal, 'run').mockRejectedValue(new Error('Database error'));
    
        const response = await request(app)
        .post('/api/upload').set('Authorization', token)
        .attach('video', Buffer.from('dummy data'), mockFile.originalname);
    
        expect(response.status).toBe(400);
        expect(response.body.error).toBe('Database error');
    });
    
    it('should cleanup temporary files on error', async () => {
        const cleanupSpy = jest.spyOn(context.VideoService, 'cleanup').mockResolvedValue();
    
        jest.spyOn(context.VideoService, 'validateVideo').mockRejectedValue(new Error('Invalid video file'));
    
        const response = await request(app)
        .post('/api/upload').set('Authorization', token)
        .attach('video', Buffer.from('dummy data'), mockFile.originalname);
    
        expect(response.status).toBe(400);
        expect(response.body.error).toBe('Invalid video file');
        expect(cleanupSpy).toHaveBeenCalled();
    });
    
    it('should handle files with special characters in the filename', async () => {
        const specialCharFile = { ...mockFile, originalname: 'v!d3o@#$%.mp4' };
    
        jest.spyOn(context.VideoService, 'validateVideo').mockResolvedValue(mockMetadata);
        jest.spyOn(context.VideoService, 'saveFile').mockResolvedValue({ filename: 'special-video.mp4' });
        jest.spyOn(context.dal, 'run').mockResolvedValue();
    
        const response = await request(app)
        .post('/api/upload').set('Authorization', token)
        .attach('video', Buffer.from('dummy data'), specialCharFile.originalname);
    
        expect(response.status).toBe(200);
        expect(response.body.filename).toBe('special-video.mp4');
    });
});
      
