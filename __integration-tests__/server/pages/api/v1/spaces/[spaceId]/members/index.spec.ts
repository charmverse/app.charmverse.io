import type { AddressInfo } from 'node:net';

import { prisma, type Space, type SuperApiToken, type User } from '@charmverse/core/prisma-client';
import { generateSuperApiKey } from '@packages/testing/generators/apiKeys';
import { baseUrl } from '@packages/testing/mockApiCall';
import { generateUserAndSpace } from '@packages/testing/setupDatabase';
import { randomETHWalletAddress } from '@packages/utils/blockchain';
import { createServer } from '__e2e__/utils/mockServer';
import request from 'supertest';
import { v4 } from 'uuid';

import { getSummonRoleLabel } from 'lib/summon/getSummonRoleLabel';

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

  it('should respond 200 with user profile and create user if no charmverse user with the provided email or wallet address exist', async () => {
    const wallet = randomETHWalletAddress().toLowerCase();
    const xpsUserId = v4();
    const tenantId = v4();
    const { listen, router } = createServer();

    router.get('/v1/xps/scan/inventory/:xpsUserId', (ctx) => {
      ctx.body = {
        data: {
          user: xpsUserId,
          tenantId,
          meta: {
            rank: 1
          }
        }
      };
    });

    const server = await listen(9000);

    const response = await request(baseUrl)
      .post(`/api/v1/spaces/${space.id}/members`)
      .query({ summonTestUrl: `http://localhost:${(server.address() as AddressInfo).port}` })
      .set('Authorization', superApiKey.token)
      .send({
        summonUserId: xpsUserId,
        wallet
      });

    const userId = response.body.id;

    const spaceRole = await prisma.spaceRole.findFirstOrThrow({
      where: {
        userId,
        spaceId: space.id
      }
    });

    const role = await prisma.role.findFirstOrThrow({
      where: {
        spaceId: space.id,
        name: getSummonRoleLabel({ level: 1 })
      }
    });

    const spaceRoleToRole = await prisma.spaceRoleToRole.findFirstOrThrow({
      where: {
        roleId: role.id,
        spaceRoleId: spaceRole.id
      }
    });

    expect(response.statusCode).toBe(200);
    expect(response.body).toMatchObject({
      wallet
    });
    expect(spaceRole).toBeTruthy();
    expect(spaceRole.xpsUserId).toBe(xpsUserId);
    expect(spaceRoleToRole).toBeTruthy();

    // Cleanup.
    await new Promise((done) => {
      server.close(done);
    });
  });
});
