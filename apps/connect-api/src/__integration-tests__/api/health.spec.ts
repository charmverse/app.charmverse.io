import { app } from '@connect-api/server';
import request from 'supertest';

describe('GET /health', () => {
  // Simple heuristic, admin can always see everything
  it('should respond 200', async () => {
    await request(app.callback()).get(`/api/health`).expect(200);
  });
});
