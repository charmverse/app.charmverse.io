import request from 'supertest';

import app from '../worker';

describe('health check', () => {
  test('should return 200', async () => {
    await request(app.callback()).get(`/api/health`).expect(200);
  });
});
