import { prepareServer } from 'connect-api/src/prepareServer';
import request from 'supertest';

let app: Awaited<ReturnType<typeof prepareServer>>;

beforeAll(async () => {
  app = await prepareServer();
});

describe('GET /api/random-number', () => {
  // Simple heuristic, admin can always see everything
  it('should return a random number and respond 200', async () => {
    const response = (await request(app.callback()).get(`/api/random-number`).expect(200)).body;

    expect(response).toMatchObject({
      number: expect.any(Number)
    });
  });
});
