import type { SuperApiToken } from '@charmverse/core/dist/prisma';
import request from 'supertest';
import { v4 } from 'uuid';

import { baseUrl } from 'testing/mockApiCall';
import { generateSuperApiToken } from 'testing/utils/middleware';

let apiToken: SuperApiToken;

beforeAll(async () => {
  const superToken = await generateSuperApiToken({ name: `test 1-${v4()}` });
  apiToken = superToken;
});

describe('GET /api/v1/spaces', () => {
  it('should respond 401 when api token is missing or invalid', async () => {
    const response = await request(baseUrl).get('/api/v1/spaces/search').send();

    expect(response.statusCode).toBe(401);

    const response2 = await request(baseUrl)
      .get('/api/v1/spaces/search')
      .set('Authorization', 'Bearer invalid-token')
      .send();

    expect(response2.statusCode).toBe(401);
  });

  it('should respond 400 with error message when space name is missing or invalid', async () => {
    const response = await request(baseUrl).get('/api/v1/spaces/search').set('Authorization', apiToken.token).send();

    expect(response.statusCode).toBe(400);
  });

  it('should respond 200 with spaces', async () => {
    const response = await request(baseUrl)
      .get('/api/v1/spaces/search')
      .set('Authorization', apiToken.token)
      .send({ userWallet: '0x000000' });
    expect(response.statusCode).toBe(200);
  });
});
