const request = require('supertest');
const makeApp = require('../dummy/app');

describe('PUT /limits', () => {

    let app, context;
    const token = 'jahkgvfkjav';

    beforeAll(async () => {
        const {app: ap1, context: con1} = await makeApp();
        app = ap1, context = con1;
    });

    beforeEach(() => {
        jest.restoreAllMocks();
    });
    
    it('should successfully update the limits', async () => {
        jest.spyOn(context.VideoService, 'updateLimits').mockResolvedValue({
            maxDuration: 300,
            minDuration: 60,
            maxSize: 50000000,
        });

        const response = await request(app)
            .put('/api/limits')
            .set('Authorization', token).send({ maxDuration: 300, minDuration: 60, maxSize: 50000000 });

        expect(response.status).toBe(200);
        expect(response.body).toMatchObject({
            success: true,
            limits: {
            maxDuration: 300,
            minDuration: 60,
            maxSize: 50000000,
            },
            updatedAt: expect.any(String),
        });
    });

    it('should return 400 if maxDuration is invalid', async () => {
        const response = await request(app)
            .put('/api/limits')
            .set('Authorization', token).send({ maxDuration: -10 });

        expect(response.status).toBe(400);
        expect(response.body.error).toBe('Invalid maxDuration');
    });

    it('should return 400 if minDuration is invalid', async () => {
        const response = await request(app)
            .put('/api/limits')
            .set('Authorization', token).send({ minDuration: 'invalid' });

        expect(response.status).toBe(400);
        expect(response.body.error).toBe('Invalid minDuration');
    });

    it('should return 400 if maxDuration is less than or equal to minDuration', async () => {
        const response = await request(app)
            .put('/api/limits')
            .set('Authorization', token).send({ maxDuration: 60, minDuration: 100 });

        expect(response.status).toBe(400);
        expect(response.body.error).toBe('maxDuration must be greater than minDuration');
    });

    it('should return 400 if maxSize is invalid', async () => {
        const response = await request(app)
            .put('/api/limits')
            .set('Authorization', token).send({ maxSize: 'not-a-number' });

        expect(response.status).toBe(400);
        expect(response.body.error).toBe('Invalid maxSize');
    });

    it('should successfully update a single limit property', async () => {
        jest.spyOn(context.VideoService, 'updateLimits').mockResolvedValue({
            maxDuration: 400,
        });

        const response = await request(app)
            .put('/api/limits')
            .set('Authorization', token).send({ maxDuration: 400 });

        expect(response.status).toBe(200);
        expect(response.body).toMatchObject({
            success: true,
            limits: { maxDuration: 400 },
            updatedAt: expect.any(String),
        });
    });

    it('should return 500 if the database operation fails', async () => {
        jest.spyOn(context.VideoService, 'updateLimits').mockRejectedValue(new Error('Database error'));

        const response = await request(app)
            .put('/api/limits')
            .set('Authorization', token).send({ maxDuration: 300 });

        expect(response.status).toBe(400);
        expect(response.body.error).toBe('Database error');
    });
});