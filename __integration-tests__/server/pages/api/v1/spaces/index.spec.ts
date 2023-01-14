import type { SuperApiToken } from '@prisma/client';
import { Wallet } from 'ethers';
import request from 'supertest';

import { prisma } from 'db';
import { baseUrl } from 'testing/mockApiCall';
import { generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { generateSuperApiToken } from 'testing/utils/middleware';

let apiToken: SuperApiToken;

const defaultSpaceData = {
  name: 'Test Space',
  adminDiscordUserId: '1337'
};

beforeAll(async () => {
  const superToken = await generateSuperApiToken({ name: 'test 1' });
  apiToken = superToken;
});

describe('GET /api/v1/spaces', () => {
  it('should respond 401 when api token is missing or invalid', async () => {
    const response = await request(baseUrl).post('/api/v1/spaces').send();

    expect(response.statusCode).toBe(401);

    const response2 = await request(baseUrl).post('/api/v1/spaces').set('Authorization', 'Bearer invalid-token').send();

    expect(response2.statusCode).toBe(401);
  });

  it('should respond 400 with error message when space name is missing or invalid', async () => {
    const response = await request(baseUrl)
      .post('/api/v1/spaces')
      .set('Authorization', apiToken.token)
      .send({ ...defaultSpaceData, name: '' });

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe('Key name is required in request body and must not be an empty value.');

    const response2 = await request(baseUrl)
      .post('/api/v1/spaces')
      .set('Authorization', apiToken.token)
      .send({ ...defaultSpaceData, name: 'ab' });

    expect(response2.statusCode).toBe(400);
    expect(response2.body.message).toBe('Workspace name must be a string at least 3 characters.');
  });

  it('should respond 400 when admin identifier is missing', async () => {
    const response = await request(baseUrl)
      .post('/api/v1/spaces')
      .set('Authorization', apiToken.token)
      .send({ ...defaultSpaceData, discordServerId: '', adminWalletAddress: '' });

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe('At least one admin identifer must be provided.');
  });

  it('should respond 201 with created space data', async () => {
    const response = await request(baseUrl)
      .post('/api/v1/spaces')
      .set('Authorization', apiToken.token)
      .send({ ...defaultSpaceData, domain: 'new-test-domain' });

    expect(response.body.id).toBeDefined();
    expect(response.body.spaceUrl).toBe(`${baseUrl}/test-space`);
    expect(response.body.joinUrl).toBe(`${baseUrl}/join?domain=test-space`);

    const space = await prisma.space.findUnique({ where: { id: response.body.id } });

    expect(response.statusCode).toBe(201);
    expect(space).toBeDefined();
    expect(space?.domain).toBe('test-space');
    expect(space?.name).toBe('Test Space');
    expect(space?.superApiTokenId).toBe(apiToken.id);

    const spaceRoles = await prisma.spaceRole.findMany({
      where: { spaceId: response.body.id },
      include: {
        user: {
          include: { discordUser: true }
        }
      }
    });

    const botUser = spaceRoles.find((role) => role.user.isBot);
    const adminUser = spaceRoles.find((role) => !role.user.isBot);

    expect(spaceRoles.length).toBe(2);

    // Verify that bot user has been created for space
    expect(botUser).toBeDefined();
    expect(botUser?.user.isBot).toBe(true);

    // Verify that admin user has been created for space
    expect(adminUser?.user.id).toBe(space?.createdBy);
    expect(adminUser).toBeDefined();
    expect(adminUser?.user?.discordUser?.discordId).toBe(defaultSpaceData.adminDiscordUserId);
  });

  it('should respond 201 and generate unique domain', async () => {
    const {
      space: { domain: existingDomain }
    } = await generateUserAndSpaceWithApiToken();

    const response = await request(baseUrl)
      .post('/api/v1/spaces')
      .set('Authorization', apiToken.token)
      .send({ ...defaultSpaceData, name: existingDomain });

    expect(response.statusCode).toBe(201);

    const space = await prisma.space.findUnique({ where: { id: response.body.id } });

    expect(space?.domain).not.toBe(existingDomain);
    expect((space?.domain as string).startsWith(existingDomain)).toBe(true);
  });

  it('should create a space for XPS Engine', async () => {
    const xpsEngineId = 'xps-4eva';
    const wallet = Wallet.createRandom();

    const response = await request(baseUrl)
      .post('/api/v1/spaces')
      .set('Authorization', apiToken.token)
      .send({ adminWalletAddress: wallet.address, xpsEngineId, name: `${Math.random()}` });

    expect(response.statusCode).toBe(201);

    const space = await prisma.space.findUnique({ where: { id: response.body.id }, include: { spaceRoles: true } });
    const adminWallet = await prisma.userWallet.findUnique({ where: { address: wallet.address } });

    expect(space?.xpsEngineId).toBe(xpsEngineId);
    expect(adminWallet).toBeDefined();
    expect(space?.spaceRoles.some((role) => role.userId === adminWallet?.userId)).toBeDefined();
  });
});

export default {};
