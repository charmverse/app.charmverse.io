import { Space } from '@charmverse/core/prisma-client';
import request from 'supertest';
import { v4 } from 'uuid';

import { baseUrl } from 'testing/mockApiCall';
import { generateRole, generateUserAndSpace } from 'testing/setupDatabase';

describe('GET /api/v1/spaces/{spaceIdOrDomain}/roles', () => {
  it('should respond 404 with error message when space with the provided domain name does not exist', async () => {
    const response = await request(baseUrl).get(`/api/v1/spaces/fake-domain-${v4()}/members`);

    expect(response.statusCode).toBe(404);
    expect(response.body.message).toBe('Space not found');
  });

  it('should respond 404 with error message when space with the provided id does not exist', async () => {
    const response = await request(baseUrl).get(`/api/v1/spaces/${v4()}/members`);

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
