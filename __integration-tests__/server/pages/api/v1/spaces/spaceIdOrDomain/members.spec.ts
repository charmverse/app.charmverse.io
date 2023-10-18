import { Space } from '@charmverse/core/prisma-client';
import request from 'supertest';
import { v4 } from 'uuid';

import { baseUrl } from 'testing/mockApiCall';
import { generateRole, generateUserAndSpace } from 'testing/setupDatabase';

describe('GET /api/v1/spaces/{spaceIdOrDomain}/members', () => {
  it('should respond 400 with error message when userId is missing', async () => {
    const response = await request(baseUrl).get(`/api/v1/spaces/${v4()}/members`).send({ userId: null });

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe('Key userId is required in request body and must not be an empty value.');
  });

  it('should respond 404 with error message when space with the provided domain name does not exist', async () => {
    const response = await request(baseUrl).get(`/api/v1/spaces/fake-domain-${v4()}/members`).send({ userId: v4() });

    expect(response.statusCode).toBe(404);
    expect(response.body.message).toBe('Space not found');
  });

  it('should respond 404 with error message when userId does not exist', async () => {
    const userId = v4();
    const response = await request(baseUrl).get(`/api/v1/spaces/${v4()}/members`).send({ userId });

    expect(response.statusCode).toBe(404);
    expect(response.body.message).toBe(`A user with id ${userId} was not found.`);
  });

  it('should respond 200 with user profile and attached space roles of user', async () => {
    const generated = await generateUserAndSpace();
    const userId = generated.user.id;
    const generatedTestRole = await generateRole({
      createdBy: userId,
      spaceId: generated.space.id,
      assigneeUserIds: [userId],
      roleName: 'test-role'
    });

    const response = await request(baseUrl).get(`/api/v1/spaces/${generated.space.id}/members`).send({ userId });

    expect(response.statusCode).toBe(200);
    expect(response.body.user.id).toBe(userId);
    expect(response.body.roles).toStrictEqual([
      {
        id: generatedTestRole.id,
        name: generatedTestRole.name
      }
    ]);
  });
});

describe('POST /api/v1/spaces/{spaceIdOrDomain}/members', () => {
  it('should respond 400 with error message when userId is missing', async () => {
    const response = await request(baseUrl)
      .post(`/api/v1/spaces/${v4()}/members`)
      .send({ userId: null, roles: ['test-role'] });

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe('Key userId is required in request body and must not be an empty value.');
  });

  it('should respond 400 with error message when roles is missing or empty', async () => {
    const response1 = await request(baseUrl).post(`/api/v1/spaces/${v4()}/members`).send({ userId: v4(), roles: null });

    expect(response1.statusCode).toBe(400);
    expect(response1.body.message).toBe('Key roles is required in request body and must not be an empty value.');

    const response2 = await request(baseUrl).post(`/api/v1/spaces/${v4()}/members`).send({ userId: v4(), roles: [] });

    expect(response2.statusCode).toBe(400);
    expect(response2.body.message).toBe('At least one role must be provided.');
  });

  it('should respond 404 with error message when space with the provided domain name does not exist', async () => {
    const response = await request(baseUrl)
      .post(`/api/v1/spaces/fake-domain-${v4()}/members`)
      .send({ userId: v4(), roles: ['test-role'] });

    expect(response.statusCode).toBe(404);
    expect(response.body.message).toBe('Space not found');
  });

  it('should respond 404 with error message when userId does not exist', async () => {
    const userId = v4();
    const response = await request(baseUrl)
      .post(`/api/v1/spaces/${v4()}/members`)
      .send({ userId, roles: ['test-role'] });

    expect(response.statusCode).toBe(404);
    expect(response.body.message).toBe(`A user with id ${userId} was not found.`);
  });

  it('should respond 404 with error message when user is not a member of the space', async () => {
    const generated = await generateUserAndSpace();
    const userId = generated.user.id;
    const spaceId = v4();
    const response = await request(baseUrl)
      .post(`/api/v1/spaces/${spaceId}/members`)
      .send({ userId, roles: ['test-role'] });

    expect(response.statusCode).toBe(404);
    expect(response.body.message).toBe(`User ${userId} is not a member of space ${spaceId}`);
  });

  it('should respond 200 with user profile and newly assigned roles of user', async () => {
    const generated = await generateUserAndSpace();
    const userId = generated.user.id;

    const response = await request(baseUrl)
      .post(`/api/v1/spaces/${generated.space.id}/members`)
      .send({ userId, roles: [v4().split('-').at(0)] });

    expect(response.statusCode).toBe(200);
    expect(response.body.user.id).toBe(userId);
    expect(response.body.roles.length).toBe(1);
  });
});
