const request = require('supertest');
const app = require('../server');
const { Queue } = require('bullmq');

jest.mock('bullmq');
jest.mock('ioredis');

describe('Activity API', () => {
  beforeEach(() => {
    Queue.mockClear();
  });

  test('POST /api/activities/schedule - should schedule activities successfully', async () => {
    const mockData = {
      user_name: 'testuser',
      activities: ['Read a book', 'Go for a walk'],
      date: '2025-04-09T10:00:00.000Z'
    };

    const response = await request(app)
      .post('/api/activities/schedule')
      .send(mockData)
      .expect(200);

    expect(response.body).toHaveProperty('message', 'Activities scheduled successfully');
    expect(response.body).toHaveProperty('jobId');
  });

  test('POST /api/activities/schedule - should validate input data', async () => {
    const invalidData = {
      user_name: 'testuser',
      activities: [], // Empty activities array should fail validation
      date: '2025-04-09T10:00:00.000Z'
    };

    const response = await request(app)
      .post('/api/activities/schedule')
      .send(invalidData)
      .expect(400);

    expect(response.body).toHaveProperty('error');
  });
});
