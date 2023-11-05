import type { ProposalCategoryPermissionFlags } from '@charmverse/core/permissions';
import type { ProposalCategory, Space, User } from '@charmverse/core/prisma';
import { v4 } from 'uuid';

import { ProposalCategoryNotFoundError } from 'lib/proposal/errors';
import { InvalidInputError } from 'lib/utilities/errors';
import { generateSpaceUser, generateUserAndSpace } from 'testing/setupDatabase';
import { generateProposalCategory } from 'testing/utils/proposals';

import { computeProposalCategoryPermissions } from '../computeProposalCategoryPermissions';

let adminUser: User;
let spaceMemberUser: User;
let space: Space;

let proposalCategory: ProposalCategory;

beforeAll(async () => {
  const generated = await generateUserAndSpace({ isAdmin: true });
  adminUser = generated.user;
  space = generated.space;
  spaceMemberUser = await generateSpaceUser({ spaceId: space.id, isAdmin: false });
  proposalCategory = await generateProposalCategory({ spaceId: space.id });
});

describe('computeProposalCategoryPermissions', () => {
  it('should return create_proposal for space members', async () => {
    const permissions = await computeProposalCategoryPermissions({
      resourceId: proposalCategory.id,
      userId: spaceMemberUser.id
    });

    expect(permissions).toMatchObject<ProposalCategoryPermissionFlags>({
      create_proposal: true,
      comment_proposals: true,
      view_category: true,
      vote_proposals: true,
      delete: false,
      edit: false,
      manage_permissions: false
    });
  });
  it('should always return full permissions for a space admin except manage_permissions', async () => {
    const permissions = await computeProposalCategoryPermissions({
      resourceId: proposalCategory.id,
      userId: adminUser.id
    });

    expect(permissions).toMatchObject<ProposalCategoryPermissionFlags>({
      create_proposal: true,
      delete: true,
      edit: true,
      comment_proposals: true,
      view_category: true,
      vote_proposals: true,
      manage_permissions: false
    });
  });

  it('should return view permissions for non space members', async () => {
    const permissions = await computeProposalCategoryPermissions({
      resourceId: proposalCategory.id,
      userId: undefined
    });

    expect(permissions).toMatchObject<ProposalCategoryPermissionFlags>({
      view_category: true,
      create_proposal: false,
      comment_proposals: false,
      vote_proposals: false,
      delete: false,
      edit: false,
      manage_permissions: false
    });
  });

  it('should throw an error if the proposal category does not exist or is invalid', async () => {
    await expect(
      computeProposalCategoryPermissions({
        resourceId: v4(),
        userId: spaceMemberUser.id
      })
    ).rejects.toBeInstanceOf(ProposalCategoryNotFoundError);

    await expect(
      computeProposalCategoryPermissions({
        resourceId: null as any,
        userId: spaceMemberUser.id
      })
    ).rejects.toBeInstanceOf(InvalidInputError);

    await expect(
      computeProposalCategoryPermissions({
        resourceId: 'text' as any,
        userId: spaceMemberUser.id
      })
    ).rejects.toBeInstanceOf(InvalidInputError);
  });
});
