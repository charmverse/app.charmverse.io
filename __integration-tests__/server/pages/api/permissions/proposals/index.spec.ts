import type { Space } from '@prisma/client';
import request from 'supertest';

import type { AssignedProposalCategoryPermission } from 'lib/permissions/proposals/interfaces';
import type { ProposalCategoryPermissionInput } from 'lib/permissions/proposals/upsertProposalCategoryPermission';
import { upsertProposalCategoryPermission } from 'lib/permissions/proposals/upsertProposalCategoryPermission';
import type { LoggedInUser } from 'models';
import { baseUrl, loginUser } from 'testing/mockApiCall';
import { generateSpaceUser, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { generateProposalCategory } from 'testing/utils/proposals';

let user: LoggedInUser;
let userCookie: string;
let adminUser: LoggedInUser;
let adminUserCookie: string;
let space: Space;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken(undefined, true);
  space = generated.space;
  adminUser = generated.user;
  adminUserCookie = await loginUser(adminUser.id);

  user = await generateSpaceUser({ isAdmin: false, spaceId: space.id });
  userCookie = await loginUser(user.id);
});

describe('POST /api/permissions/proposals - Add proposal category permissions', () => {
  it('should succeed if the user is an admin, and respond 201', async () => {
    const proposalCategory = await generateProposalCategory({
      spaceId: space.id
    });
    const permissionToCreate: ProposalCategoryPermissionInput = {
      assignee: { group: 'space', id: space.id },
      permissionLevel: 'full_access',
      proposalCategoryId: proposalCategory.id
    };

    const result = (
      await request(baseUrl)
        .post('/api/permissions/proposals')
        .set('Cookie', adminUserCookie)
        .send(permissionToCreate)
        .expect(201)
    ).body as AssignedProposalCategoryPermission;

    expect(result).toMatchObject(
      expect.objectContaining<AssignedProposalCategoryPermission>({
        id: expect.any(String),
        permissionLevel: 'full_access',
        proposalCategoryId: proposalCategory.id,
        assignee: {
          group: 'space',
          id: space.id
        }
      })
    );
  });

  it('should fail if the user is not an admin and respond 401', async () => {
    const proposalCategory = await generateProposalCategory({
      spaceId: space.id
    });
    const permissionToCreate: ProposalCategoryPermissionInput = {
      assignee: { group: 'space', id: space.id },
      permissionLevel: 'full_access',
      proposalCategoryId: proposalCategory.id
    };

    await request(baseUrl)
      .post('/api/permissions/proposals')
      .set('Cookie', userCookie)
      .send(permissionToCreate)
      .expect(401);
  });
});

describe('DELETE /api/permissions/proposals - Delete proposal category permissions', () => {
  it('should succeed if the user is an admin, and respond 200', async () => {
    const proposalCategory = await generateProposalCategory({
      spaceId: space.id
    });

    const permissionToDelete = await upsertProposalCategoryPermission({
      assignee: { group: 'space', id: space.id },
      permissionLevel: 'full_access',
      proposalCategoryId: proposalCategory.id
    });

    await request(baseUrl)
      .delete('/api/permissions/proposals')
      .set('Cookie', adminUserCookie)
      .send({ permissionId: permissionToDelete.id })
      .expect(200);
  });
  it('should fail if the user is not an admin and respond 401', async () => {
    const proposalCategory = await generateProposalCategory({
      spaceId: space.id
    });

    const permissionToDelete = await upsertProposalCategoryPermission({
      assignee: { group: 'space', id: space.id },
      permissionLevel: 'full_access',
      proposalCategoryId: proposalCategory.id
    });

    await request(baseUrl)
      .delete('/api/permissions/proposals')
      .set('Cookie', userCookie)
      .send({ permissionId: permissionToDelete.id })
      .expect(401);
  });
});
