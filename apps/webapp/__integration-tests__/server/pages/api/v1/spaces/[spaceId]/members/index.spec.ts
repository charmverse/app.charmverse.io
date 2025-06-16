import { prisma, type Space, type SuperApiToken, type User } from '@charmverse/core/prisma-client';
import { generateSuperApiKey } from '@packages/testing/generators/apiKeys';
import { baseUrl } from '@packages/testing/mockApiCall';
import { generateUserAndSpace } from '@packages/testing/setupDatabase';
import { randomETHWalletAddress } from '@packages/utils/blockchain';
import request from 'supertest';
import { v4 } from 'uuid';

let superApiKey: SuperApiToken;
let space: Space;
const spaceXpsEngineId = v4();

beforeAll(async () => {
  const generated = await generateUserAndSpace({
    xpsEngineId: spaceXpsEngineId
  });
  space = generated.space;
  superApiKey = await generateSuperApiKey({
    spaceId: space.id
  });
});

describe('POST /api/v1/spaces/{spaceId}/members', () => {
  it('should respond 400 when wallet is missing from payload', async () => {
    const response = await request(baseUrl)
      .post(`/api/v1/spaces/${space.id}/members`)
      .set('Authorization', superApiKey.token)
      .send({
        email: 'john.doe@gmail.com'
      });

    expect(response.statusCode).toBe(400);
  });

  it('should respond 401 when api token is missing or invalid', async () => {
    const response = await request(baseUrl)
      .post(`/api/v1/spaces/${space.id}/members`)
      .set('Authorization', 'Bearer invalid-token')
      .send({
        wallet: randomETHWalletAddress()
      });

    expect(response.statusCode).toBe(401);
  });
});
