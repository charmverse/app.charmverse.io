import type { Server } from 'http';

import request from 'supertest';

import app from '../worker';

let server: Server;

beforeAll(() => {
  server = app.listen();
});

afterAll((done) => {
  server.close(done);
});

describe('health check', () => {
  test('should return 200', async () => {
    await request(server).post(`/hello-world`).expect(200);
  });
});
