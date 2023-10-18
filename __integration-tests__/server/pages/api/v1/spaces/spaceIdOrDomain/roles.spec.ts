import type { Role } from '@charmverse/core/prisma-client';
import request from 'supertest';
import { v4 } from 'uuid';

import { baseUrl } from 'testing/mockApiCall';
import { generateRole, generateUserAndSpace } from 'testing/setupDatabase';

describe('GET /api/v1/spaces/{spaceIdOrDomain}/roles', () => {
  it('should respond 404 with error message when space with the provided domain name does not exist', async () => {
    const response = await request(baseUrl).get(`/api/v1/spaces/fake-domain-${v4()}/roles`);

    expect(response.statusCode).toBe(404);
    expect(response.body.message).toBe('Space not found');
  });

  it('should respond 404 with error message when space with the provided id does not exist', async () => {
    const response = await request(baseUrl).get(`/api/v1/spaces/${v4()}/roles`);

    expect(response.statusCode).toBe(404);
    expect(response.body.message).toBe('Space not found');
  });

  it('should respond 200 with list of space roles', async () => {
    const generated = await generateUserAndSpace();
    const userId = generated.user.id;
    const spaceId = generated.space.id;

    const spaceRoles = await Promise.all([
      generateRole({
        createdBy: userId,
        spaceId,
        roleName: 'test-role-1'
      }),
      generateRole({
        createdBy: userId,
        spaceId,
        roleName: 'test-role-2'
      })
    ]);

    const response = await request(baseUrl).get(`/api/v1/spaces/${spaceId}/roles`);

    expect(response.statusCode).toBe(200);
    expect(response.body.space.id).toBe(spaceId);
    expect((response.body.roles as Role[]).sort((roleA, roleB) => (roleA.name > roleB.name ? 1 : -1))).toStrictEqual(
      spaceRoles
        .map((spaceRole) => ({
          name: spaceRole.name,
          id: spaceRole.id
        }))
        .sort((roleA, roleB) => (roleA.name > roleB.name ? 1 : -1))
    );
  });
});
