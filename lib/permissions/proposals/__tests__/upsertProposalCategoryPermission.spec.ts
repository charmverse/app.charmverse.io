import type { ProposalCategory, Space, User } from '@prisma/client';
import { v4 } from 'uuid';

import { AssignmentNotPermittedError } from 'lib/permissions/errors';
import { DataNotFoundError, InsecureOperationError, InvalidInputError } from 'lib/utilities/errors';
import { generateRole, generateUserAndSpace } from 'testing/setupDatabase';
import { generateProposalCategory } from 'testing/utils/proposals';

import { upsertProposalCategoryPermission } from '../upsertProposalCategoryPermission';

let space: Space;
let user: User;
let proposalCategory: ProposalCategory;

beforeAll(async () => {
  const generated = await generateUserAndSpace();
  space = generated.space;
  user = generated.user;
  proposalCategory = await generateProposalCategory({ spaceId: space.id });
});

describe('upsertProposalCategoryPermission', () => {
  it('should create a new proposal category permission with a role assignee', async () => {
    const role = await generateRole({ createdBy: user.id, spaceId: space.id });
    const permission = await upsertProposalCategoryPermission({
      permissionLevel: 'full_access',
      proposalCategoryId: proposalCategory.id,
      assignee: { group: 'role', id: role.id }
    });

    expect(permission.permissionLevel).toBe('full_access');
    expect(permission.assignee.group).toBe('role');
    expect(permission.assignee.id).toBe(role.id);
  });

  it('should create a new proposal category permission with a space assignee', async () => {
    const permission = await upsertProposalCategoryPermission({
      permissionLevel: 'full_access',
      proposalCategoryId: proposalCategory.id,
      assignee: { group: 'space', id: space.id }
    });

    expect(permission.permissionLevel).toBe('full_access');
    expect(permission.assignee.group).toBe('space');
    expect(permission.assignee.id).toBe(space.id);
  });

  it('should create a new proposal category permission with a public assignee', async () => {
    const permission = await upsertProposalCategoryPermission({
      permissionLevel: 'view',
      proposalCategoryId: proposalCategory.id,
      assignee: { group: 'public' }
    });

    expect(permission.permissionLevel).toBe('view');
    expect(permission.assignee.group).toBe('public');
    expect((permission.assignee as any).id).toBeUndefined();
  });

  it('should update an existing permission for the same group', async () => {
    const role = await generateRole({ createdBy: user.id, spaceId: space.id });

    const permission = await upsertProposalCategoryPermission({
      permissionLevel: 'full_access',
      proposalCategoryId: proposalCategory.id,
      assignee: { group: 'role', id: role.id }
    });

    const afterUpdate = await upsertProposalCategoryPermission({
      permissionLevel: 'view',
      proposalCategoryId: proposalCategory.id,
      assignee: { group: 'role', id: role.id }
    });

    expect(afterUpdate.permissionLevel).toBe('view');
    expect(afterUpdate.id).toBe(permission.id);
  });

  // Re-add this test when we add support for custom permissions
  // it('should should leave category operation and proposal operation fields empty when the level is not "custom"', async () => {
  //   const role = await generateRole({ createdBy: user.id, spaceId: space.id });

  //   const permission = await upsertProposalCategoryPermission({
  //     permissionLevel: 'full_access',
  //     proposalCategoryId: proposalCategory.id,
  //     assignee: { group: 'role', id: role.id }
  //   });

  //   expect(permission.categoryOperations.length).toBe(0);
  //   expect(permission.proposalOperations.length).toBe(0);
  // });

  it('should fail to create a new proposal category permission for roles or spaces not matching the current space', async () => {
    const { space: otherSpace, user: otherSpaceUser } = await generateUserAndSpace();
    const role = await generateRole({ createdBy: otherSpaceUser.id, spaceId: otherSpace.id });

    await expect(
      upsertProposalCategoryPermission({
        permissionLevel: 'full_access',
        proposalCategoryId: proposalCategory.id,
        assignee: {
          group: 'role',
          id: role.id
        }
      })
    ).rejects.toBeInstanceOf(InsecureOperationError);

    await expect(
      upsertProposalCategoryPermission({
        permissionLevel: 'full_access',
        proposalCategoryId: proposalCategory.id,
        assignee: {
          group: 'space',
          id: otherSpace.id
        }
      })
    ).rejects.toBeInstanceOf(InsecureOperationError);
  });

  it('should fail to create a new proposal category permission if no assignee is provided', async () => {
    await expect(
      upsertProposalCategoryPermission({
        permissionLevel: 'full_access',
        proposalCategoryId: proposalCategory.id
      } as any)
    ).rejects.toBeInstanceOf(InvalidInputError);
  });

  it('should fail to create a new proposal category permission if the proposal category does not exist or the ID is invalid', async () => {
    await expect(
      upsertProposalCategoryPermission({
        permissionLevel: 'full_access',
        proposalCategoryId: 'invalid-uuid',
        assignee: {
          group: 'space',
          id: space.id
        }
      })
    ).rejects.toBeInstanceOf(InvalidInputError);

    await expect(
      upsertProposalCategoryPermission({
        permissionLevel: 'full_access',
        proposalCategoryId: v4(),
        assignee: {
          group: 'space',
          id: space.id
        }
      })
    ).rejects.toBeInstanceOf(DataNotFoundError);
  });

  it('should fail to create a new proposal category permission if permission level is not provided or is invalid', async () => {
    await expect(
      upsertProposalCategoryPermission({
        permissionLevel: undefined as any,
        proposalCategoryId: proposalCategory.id,
        assignee: {
          group: 'space',
          id: space.id
        }
      })
    ).rejects.toBeInstanceOf(InvalidInputError);

    await expect(
      upsertProposalCategoryPermission({
        permissionLevel: 'abcde' as any,
        proposalCategoryId: proposalCategory.id,
        assignee: {
          group: 'space',
          id: space.id
        }
      })
    ).rejects.toBeInstanceOf(InvalidInputError);
  });

  it('should fail to create a new proposal category permission for the user assignee', async () => {
    await expect(
      upsertProposalCategoryPermission({
        permissionLevel: 'full_access',
        proposalCategoryId: proposalCategory.id,
        assignee: {
          group: 'user' as any,
          id: user.id
        }
      })
    ).rejects.toBeInstanceOf(AssignmentNotPermittedError);
  });

  it('should fail to create a new proposal category permission for the public group if the permission level is other than "guest"', async () => {
    await expect(
      upsertProposalCategoryPermission({
        permissionLevel: 'full_access',
        proposalCategoryId: proposalCategory.id,
        assignee: {
          group: 'public'
        }
      })
    ).rejects.toBeInstanceOf(InsecureOperationError);
  });
});
