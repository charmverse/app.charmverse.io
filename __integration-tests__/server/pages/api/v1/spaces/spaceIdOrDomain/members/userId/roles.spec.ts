import request from 'supertest';
import { v4 } from 'uuid';

import { baseUrl } from 'testing/mockApiCall';
import { generateUserAndSpace } from 'testing/setupDatabase';

describe('POST /api/v1/spaces/{spaceIdOrDomain}/members/{memberId}/roles', () => {
  it('should respond 400 with error message when roles is missing or empty', async () => {
    const response1 = await request(baseUrl).post(`/api/v1/spaces/${v4()}/members/${v4()}/roles`).send({ roles: null });

    expect(response1.statusCode).toBe(400);
    expect(response1.body.message).toBe('Key roles is required in request body and must not be an empty value.');

    const response2 = await request(baseUrl).post(`/api/v1/spaces/${v4()}/members/${v4()}/roles`).send({ roles: [] });

    expect(response2.statusCode).toBe(400);
    expect(response2.body.message).toBe('At least one role must be provided.');
  });

  it('should respond 404 with error message when space with the provided domain name does not exist', async () => {
    const response = await request(baseUrl)
      .post(`/api/v1/spaces/fake-domain-${v4()}/members/${v4()}/roles`)
      .send({ userId: v4(), roles: ['test-role'] });

    expect(response.statusCode).toBe(404);
    expect(response.body.message).toBe('Space not found');
  });

  it('should respond 404 with error message when userId does not exist', async () => {
    const userId = v4();
    const response = await request(baseUrl)
      .post(`/api/v1/spaces/${v4()}/members/${userId}/roles`)
      .send({ userId, roles: ['test-role'] });

    expect(response.statusCode).toBe(404);
    expect(response.body.message).toBe(`A user with id ${userId} was not found.`);
  });

  it('should respond 404 with error message when user is not a member of the space', async () => {
    const generated = await generateUserAndSpace();
    const userId = generated.user.id;
    const spaceId = v4();
    const response = await request(baseUrl)
      .post(`/api/v1/spaces/${spaceId}/members/${userId}/roles`)
      .send({ userId, roles: ['test-role'] });

    expect(response.statusCode).toBe(404);
    expect(response.body.message).toBe(`User ${userId} is not a member of space ${spaceId}`);
  });

  it('should respond 200 with user profile and newly assigned roles of user', async () => {
    const generated = await generateUserAndSpace();
    const userId = generated.user.id;

    const response = await request(baseUrl)
      .post(`/api/v1/spaces/${generated.space.id}/members/${userId}/roles`)
      .send({ userId, roles: [v4().split('-').at(0)] });

    expect(response.statusCode).toBe(200);
    expect(response.body.user.id).toBe(userId);
    expect(response.body.roles.length).toBe(1);
  });
});
