import request from 'supertest';

import { app } from '@connect-api/server';

describe('GET /health', () => {
  // Simple heuristic, admin can always see everything
  it('should respond 200', async () => {
    await request(app.callback()).get(`/api/health`).expect(200);
  });
});
