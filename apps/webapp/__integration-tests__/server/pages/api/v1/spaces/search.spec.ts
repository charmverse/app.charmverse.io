import type { Space, SuperApiToken } from '@charmverse/core/prisma';
import { testUtilsUser } from '@charmverse/core/test';
import { generateSuperApiKey } from '@packages/testing/generators/apiKeys';
import { baseUrl } from '@packages/testing/mockApiCall';
import { generateUserAndSpace } from '@packages/testing/setupDatabase';
import { randomETHWalletAddress } from '@packages/utils/blockchain';
import request from 'supertest';

let superApiToken: SuperApiToken;
let space: Space;

beforeAll(async () => {
  space = (await testUtilsUser.generateUserAndSpace()).space;
  superApiToken = await generateSuperApiKey({ spaceId: space.id });
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
    const response = await request(baseUrl)
      .get('/api/v1/spaces/search')
      .set('Authorization', superApiToken.token)
      .send();

    expect(response.statusCode).toBe(400);
  });

  it('should respond 200 with spaces', async () => {
    const walletAddress = randomETHWalletAddress();
    const data = await generateUserAndSpace({ walletAddress, superApiTokenId: superApiToken.id });
    const response = await request(baseUrl)
      .get('/api/v1/spaces/search')
      .set('Authorization', superApiToken.token)
      .query({ userWallet: walletAddress });
    expect(response.statusCode).toBe(200);
    expect(response.body.length).toBe(1);
    expect(response.body[0].id).toBe(data.space.id);
  });
});
