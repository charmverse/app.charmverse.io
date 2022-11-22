
import type { SuperApiToken } from '@prisma/client';
import request from 'supertest';

import { prisma } from 'db';
import { baseUrl } from 'testing/mockApiCall';
import { generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { generateSuperApiToken } from 'testing/utils/middleware';

let apiToken: SuperApiToken;

const defaultSpaceData = {
  name: 'Test Space',
  domain: 'test-space',
  discordServerId: '1234',
  avatar: ''
};

beforeAll(async () => {
  const superToken = await generateSuperApiToken({ name: 'test 1' });
  apiToken = superToken;
});

describe('GET /api/v1/spaces', () => {

  it('should respond 401 when api token is missing or invalid', async () => {
    const response = await request(baseUrl)
      .post('/api/v1/spaces')
      .send();

    expect(response.statusCode).toBe(401);

    const response2 = await request(baseUrl)
      .post('/api/v1/spaces')
      .set('Authorization', 'Bearer invalid-token')
      .send();

    expect(response2.statusCode).toBe(401);
  });

  it('should respond 400 with error message when space name is missing or invalid', async () => {
    const response = await request(baseUrl)
      .post('/api/v1/spaces')
      .set('Authorization', apiToken.token)
      .send({ ...defaultSpaceData, name: '' });

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe('Missing space name');

    const response2 = await request(baseUrl)
      .post('/api/v1/spaces')
      .set('Authorization', apiToken.token)
      .send({ ...defaultSpaceData, name: 'ab' });

    expect(response2.statusCode).toBe(400);
    expect(response2.body.message).toBe('Space name must be at least 3 characters');
  });

  it('should respond 400 when discord server id is missing', async () => {
    const response = await request(baseUrl)
      .post('/api/v1/spaces')
      .set('Authorization', apiToken.token)
      .send({ ...defaultSpaceData, discordServerId: '' });

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe('Missing discord server id');
  });

  it('should respond 400 when discord server id is missing', async () => {
    const response = await request(baseUrl)
      .post('/api/v1/spaces')
      .set('Authorization', apiToken.token)
      .send({ ...defaultSpaceData, discordServerId: '' });

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe('Missing discord server id');
  });

  it('should respond 400 when provided domain name is invalid', async () => {
    const response = await request(baseUrl)
      .post('/api/v1/spaces')
      .set('Authorization', apiToken.token)
      .send({ ...defaultSpaceData, domain: 'ab' });

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe('Invalid domain name. Domain must be at least 3 characters');

    const response2 = await request(baseUrl)
      .post('/api/v1/spaces')
      .set('Authorization', apiToken.token)
      // domain from blacklist
      .send({ ...defaultSpaceData, domain: 'api' });

    expect(response2.statusCode).toBe(400);
    expect(response2.body.message).toBe('Invalid domain name. Domain is not allowed');

    const response3 = await request(baseUrl)
      .post('/api/v1/spaces')
      .set('Authorization', apiToken.token)
    // domain from blacklist
      .send({ ...defaultSpaceData, domain: '123*,123£' });

    expect(response3.statusCode).toBe(400);
    expect(response3.body.message).toBe('Domain must be only lowercase hyphens, letters, and numbers');
  });

  it('should respond 409 when provided domain name is already taken', async () => {
    const { space: existingSpace } = await generateUserAndSpaceWithApiToken();

    const response = await request(baseUrl)
      .post('/api/v1/spaces')
      .set('Authorization', apiToken.token)
      .send({ ...defaultSpaceData, domain: existingSpace.domain });

    expect(response.statusCode).toBe(409);
    expect(response.body.message).toBe('Domain name is already taken');
  });

  it('should respond 201 with created space data', async () => {
    const response = await request(baseUrl)
      .post('/api/v1/spaces')
      .set('Authorization', apiToken.token)
      .send({ ...defaultSpaceData, domain: 'new-test-domain' });

    expect(response.statusCode).toBe(201);
    expect(response.body.id).toBeDefined();
    expect(response.body.domain).toBe('new-test-domain');
    expect(response.body.name).toBe('Test Space');
    expect(response.body.superApiTokenId).toBe(apiToken.id);

    const spaceRoles = await prisma.spaceRole.findMany({
      where: { spaceId: response.body.id },
      include: { user: true }
    });

    // Verify that bot user has been created for space
    expect(spaceRoles.length).toBe(1);
    expect(spaceRoles[0].isAdmin).toBe(true);
    expect(spaceRoles[0].user.id).toBe(response.body.createdBy);
    expect(spaceRoles[0].user.isBot).toBe(true);
  });
});

export default {};
