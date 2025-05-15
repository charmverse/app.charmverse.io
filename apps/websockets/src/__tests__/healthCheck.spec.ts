import type { Server } from 'http';

import request from 'supertest';

import app from '../healthCheck/app';

let server: Server;

beforeAll(() => {
  server = app.listen();
});

afterAll(async () => {
  await new Promise((resolve) => {
    server.close(resolve);
  });
});

describe('health check', () => {
  test('should return 200', async () => {
    await request(server).get(`/api/health`).expect(200);
  });
});
