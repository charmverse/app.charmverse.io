import type { Role, Space, User } from '@prisma/client';
import { v4 } from 'uuid';

import { ProposalCategoryNotFoundError } from 'lib/proposal/errors';
import { InvalidInputError } from 'lib/utilities/errors';
import { generateRole, generateUserAndSpace } from 'testing/setupDatabase';
import { generateProposalCategory } from 'testing/utils/proposals';

import { listProposalCategoryPermissions } from '../listProposalCategoryPermissions';
import { upsertProposalCategoryPermission } from '../upsertProposalCategoryPermission';

let space: Space;
let user: User;
let role: Role;

beforeAll(async () => {
  const generated = await generateUserAndSpace({
    isAdmin: false
  });
  space = generated.space;
  user = generated.user;
  role = await generateRole({
    createdBy: user.id,
    spaceId: space.id,
    assigneeUserIds: [user.id]
  });
});
describe('listProposalCategoryPermissions', () => {
  it('should return all assigned permissions for space members', async () => {
    const proposalCategory = await generateProposalCategory({ spaceId: space.id });
    const permissions = await Promise.all([
      upsertProposalCategoryPermission({
        assignee: { group: 'role', id: role.id },
        permissionLevel: 'full_access',
        proposalCategoryId: proposalCategory.id
      }),
      upsertProposalCategoryPermission({
        assignee: { group: 'space', id: space.id },
        permissionLevel: 'view',
        proposalCategoryId: proposalCategory.id
      }),
      upsertProposalCategoryPermission({
        assignee: { group: 'public' },
        permissionLevel: 'view',
        proposalCategoryId: proposalCategory.id
      })
    ]);

    const foundPermissions = await listProposalCategoryPermissions({
      resourceId: proposalCategory.id,
      userId: user.id
    });

    expect(foundPermissions.length).toBe(permissions.length);
    foundPermissions.forEach((foundPermission) => {
      expect(permissions).toContainEqual(expect.objectContaining(foundPermission));
    });
  });

  it('should return an empty list for non-space members', async () => {
    const proposalCategory = await generateProposalCategory({ spaceId: space.id });
    await Promise.all([
      upsertProposalCategoryPermission({
        assignee: { group: 'role', id: role.id },
        permissionLevel: 'full_access',
        proposalCategoryId: proposalCategory.id
      }),
      upsertProposalCategoryPermission({
        assignee: { group: 'space', id: space.id },
        permissionLevel: 'view',
        proposalCategoryId: proposalCategory.id
      }),
      upsertProposalCategoryPermission({
        assignee: { group: 'public' },
        permissionLevel: 'view',
        proposalCategoryId: proposalCategory.id
      })
    ]);

    const { user: otherSpaceUser } = await generateUserAndSpace({
      isAdmin: true
    });

    const foundPermissions = await listProposalCategoryPermissions({
      resourceId: proposalCategory.id,
      userId: otherSpaceUser.id
    });

    expect(foundPermissions.length).toBe(0);

    const foundPublicPermissions = await listProposalCategoryPermissions({
      resourceId: proposalCategory.id,
      userId: undefined
    });

    expect(foundPublicPermissions.length).toBe(0);
  });

  it('should throw an error if the proposal category does not exist or the ID is invalid', async () => {
    await expect(
      listProposalCategoryPermissions({
        resourceId: 'invalid-proposal-category',
        userId: user.id
      })
    ).rejects.toBeInstanceOf(InvalidInputError);

    await expect(
      listProposalCategoryPermissions({
        resourceId: undefined as any,
        userId: user.id
      })
    ).rejects.toBeInstanceOf(InvalidInputError);

    await expect(
      listProposalCategoryPermissions({
        resourceId: v4(),
        userId: user.id
      })
    ).rejects.toBeInstanceOf(ProposalCategoryNotFoundError);
  });
});
