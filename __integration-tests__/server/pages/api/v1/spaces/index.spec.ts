import type { SuperApiToken } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import request from 'supertest';
import { v4 as uuid } from 'uuid';

import { getSpaceDomainFromName } from 'lib/spaces/utils';
import { randomETHWallet } from 'lib/utilities/blockchain';
import { baseUrl } from 'testing/mockApiCall';
import { generateUserAndSpace } from 'testing/setupDatabase';
import { generateSuperApiToken } from 'testing/utils/middleware';

let apiToken: SuperApiToken;

const defaultSpaceData = {
  name: `Test Space`,
  adminDiscordUserId: `1337-${uuid()}`
};

beforeAll(async () => {
  apiToken = await generateSuperApiToken({ name: `test 1-${uuid()}` });
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
    expect(response2.body.message).toBe('Space name must be a string at least 3 characters.');
  });

  it('should respond 400 when admin identifier is missing', async () => {
    const response = await request(baseUrl)
      .post('/api/v1/spaces')
      .set('Authorization', apiToken.token)
      .send({ ...defaultSpaceData, adminDiscordUserId: '', adminWalletAddress: '' });

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe('At least one admin identifer must be provided.');
  });

  it('should respond 201 with created space data', async () => {
    const spaceName = `Test Space - ${Date.now()}`;
    const response = await request(baseUrl)
      .post('/api/v1/spaces')
      .set('Authorization', apiToken.token)
      .send({ ...defaultSpaceData, name: spaceName });

    const expectedDomain = getSpaceDomainFromName(spaceName);

    expect(response.body.id).toBeDefined();
    expect(response.body.spaceUrl).toBe(`${baseUrl}/${expectedDomain}`);
    expect(response.body.joinUrl).toBe(`${baseUrl}/join?domain=${expectedDomain}`);

    const space = await prisma.space.findUnique({ where: { id: response.body.id } });

    expect(response.statusCode).toBe(201);
    expect(space).toBeDefined();
    expect(space?.domain).toBe(expectedDomain);
    expect(space?.name).toBe(spaceName);
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
    } = await generateUserAndSpace();

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
    const xpsEngineId = `xps-4eva-${uuid()}`;
    const wallet = randomETHWallet();

    const response = await request(baseUrl)
      .post('/api/v1/spaces')
      .set('Authorization', apiToken.token)
      .send({ adminWalletAddress: wallet.address, xpsEngineId, name: `${Date.now()}` });

    expect(response.statusCode).toBe(201);

    const space = await prisma.space.findUnique({ where: { id: response.body.id }, include: { spaceRoles: true } });
    const adminWallet = await prisma.userWallet.findUnique({ where: { address: wallet.address } });

    expect(space?.xpsEngineId).toBe(xpsEngineId);
    expect(adminWallet).toBeDefined();
    expect(space?.spaceRoles.some((role) => role.userId === adminWallet?.userId)).toBeDefined();
  });
});

export default {};
