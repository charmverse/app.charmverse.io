import type { Space, User } from '@charmverse/core/dist/prisma';

import { addSpaceOperations } from 'lib/permissions/spaces';
import { InvalidInputError } from 'lib/utilities/errors';
import { generateRole, generateSpaceUser, generateUserAndSpace } from 'testing/setupDatabase';

import { hasSpaceWideProposalReviewerPermission } from '../hasSpaceWideProposalReviewerPermission';

let space: Space;
let user: User;

beforeAll(async () => {
  const generated = await generateUserAndSpace();
  space = generated.space;
  user = generated.user;
});

describe('hasSpaceWideProposalReviewerPermission', () => {
  it('should return true if user has a role with space-wide proposal reviewer permission', async () => {
    const role = await generateRole({
      spaceId: space.id,
      createdBy: user.id,
      assigneeUserIds: [user.id]
    });

    await addSpaceOperations({
      forSpaceId: space.id,
      operations: ['reviewProposals'],
      roleId: role.id
    });

    const result = await hasSpaceWideProposalReviewerPermission({ spaceId: space.id, userId: user.id });

    expect(result).toBe(true);
  });

  it('should return true if proposal reviewer is enabled for the whole space', async () => {
    const { space: spaceWithEnabledProposals, user: userInSpace } = await generateUserAndSpace();

    await addSpaceOperations({
      forSpaceId: spaceWithEnabledProposals.id,
      operations: ['reviewProposals'],
      spaceId: spaceWithEnabledProposals.id
    });

    const result = await hasSpaceWideProposalReviewerPermission({
      spaceId: spaceWithEnabledProposals.id,
      userId: userInSpace.id
    });

    expect(result).toBe(true);
  });

  it('should return true if user is a space admin', async () => {
    const adminUser = await generateSpaceUser({
      isAdmin: true,
      spaceId: space.id
    });

    const result = await hasSpaceWideProposalReviewerPermission({ spaceId: space.id, userId: adminUser.id });

    expect(result).toBe(true);
  });

  it('should return false if userId is undefined', async () => {
    const result = await hasSpaceWideProposalReviewerPermission({ spaceId: space.id, userId: undefined });

    expect(result).toBe(false);
  });

  it('should return false if user does not have a role with space-wide moderate forums permission', async () => {
    const userWithoutRoles = await generateSpaceUser({
      isAdmin: false,
      spaceId: space.id
    });
    const result = await hasSpaceWideProposalReviewerPermission({ spaceId: space.id, userId: userWithoutRoles.id });

    expect(result).toBe(false);
  });

  it('should throw an error if spaceid is undefined', async () => {
    await expect(hasSpaceWideProposalReviewerPermission({ spaceId: undefined as any })).rejects.toBeInstanceOf(
      InvalidInputError
    );
  });
});
