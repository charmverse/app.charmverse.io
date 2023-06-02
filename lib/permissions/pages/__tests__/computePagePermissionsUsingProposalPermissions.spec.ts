import type { ProposalStatus, Space, User } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';

import { upsertProposalCategoryPermission } from 'lib/permissions/proposals/upsertProposalCategoryPermission';
import { typedKeys } from 'lib/utilities/objects';
import { generateSpaceUser, generateUserAndSpace } from 'testing/setupDatabase';
import { generateProposal, generateProposalCategory } from 'testing/utils/proposals';

import { computePagePermissionsUsingProposalPermissions } from '../computePagePermissionsUsingProposalPermissions';

let authorUser: User;
let memberUser: User;
let space: Space;

beforeAll(async () => {
  const generated = await generateUserAndSpace({
    isAdmin: false
  });
  space = generated.space;

  authorUser = await generateSpaceUser({
    spaceId: space.id,
    isAdmin: false
  });
  memberUser = await generateSpaceUser({
    spaceId: space.id,
    isAdmin: false
  });
});

describe('computePagePermissionsUsingProposalPermissions', () => {
  it('should convert proposal permissions', async () => {
    const proposalCategory = await generateProposalCategory({
      spaceId: space.id
    });
    const proposal = await generateProposal({
      categoryId: proposalCategory.id,
      spaceId: space.id,
      userId: authorUser.id,
      proposalStatus: 'discussion'
    });

    const authorPermissions = await computePagePermissionsUsingProposalPermissions({
      resourceId: proposal.id,
      userId: authorUser.id
    });

    expect(authorPermissions.edit_content).toBe(true);
    expect(authorPermissions.delete).toBe(true);
    expect(authorPermissions.read).toBe(true);

    const memberPermissions = await computePagePermissionsUsingProposalPermissions({
      resourceId: proposal.id,
      userId: memberUser.id
    });

    expect(memberPermissions.edit_content).toBe(false);
    expect(memberPermissions.delete).toBe(false);
    expect(memberPermissions.read).toBe(true);
  });
});
