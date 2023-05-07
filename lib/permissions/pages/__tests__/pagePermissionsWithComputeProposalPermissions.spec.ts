import { prisma } from '@charmverse/core';
import type { ProposalStatus, Space, User } from '@charmverse/core/prisma';

import { upsertProposalCategoryPermission } from 'lib/permissions/proposals/upsertProposalCategoryPermission';
import { typedKeys } from 'lib/utilities/objects';
import { generateSpaceUser, generateUserAndSpace } from 'testing/setupDatabase';
import { generateProposal, generateProposalCategory } from 'testing/utils/proposals';

import { computePagePermissionsUsingProposalPermissions } from '../pagePermissionsWithComputeProposalPermissions';

let authorUser: User;
let adminUser: User;
let memberUser: User;
let space: Space;

beforeAll(async () => {
  const generated = await generateUserAndSpace({
    isAdmin: true
  });
  adminUser = generated.user;
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

describe('pagePermissionsWithComputeProposalPermissions', () => {
  it('should convert proposal permissions, and also account for a public-level page permission', async () => {
    const proposalCategory = await generateProposalCategory({
      spaceId: space.id
    });
    const proposal = await generateProposal({
      categoryId: proposalCategory.id,
      spaceId: space.id,
      userId: authorUser.id,
      proposalStatus: 'discussion'
    });

    await prisma.pagePermission.create({
      data: {
        public: true,
        page: { connect: { id: proposal.id } },
        permissionLevel: 'view'
      }
    });

    const permissions = await computePagePermissionsUsingProposalPermissions({
      resourceId: proposal.id,
      userId: undefined
    });

    typedKeys(permissions).forEach((key) => {
      if (key === 'read') {
        expect(permissions[key]).toBe(true);
      } else {
        expect(permissions[key]).toBe(false);
      }
    });
  });

  it('should always allow the proposal author or an admin to make a proposal public', async () => {
    const proposalCategory = await generateProposalCategory({
      spaceId: space.id
    });

    // Members should have full access to the target category
    await upsertProposalCategoryPermission({
      proposalCategoryId: proposalCategory.id,
      permissionLevel: 'full_access',
      assignee: {
        group: 'space',
        id: space.id
      }
    });

    const proposal = await generateProposal({
      categoryId: proposalCategory.id,
      spaceId: space.id,
      userId: authorUser.id,
      proposalStatus: 'discussion'
    });

    const proposalStatuses: ProposalStatus[] = [
      'draft',
      'discussion',
      'review',
      'reviewed',
      'vote_active',
      'vote_closed'
    ];

    for (const proposalStatus of proposalStatuses) {
      await prisma.proposal.update({
        where: {
          id: proposal.id
        },
        data: {
          status: proposalStatus
        }
      });

      const authorPermissions = await computePagePermissionsUsingProposalPermissions({
        resourceId: proposal.id,
        userId: authorUser.id
      });

      const adminPermissions = await computePagePermissionsUsingProposalPermissions({
        resourceId: proposal.id,
        userId: adminUser.id
      });

      const memberPermissions = await computePagePermissionsUsingProposalPermissions({
        resourceId: proposal.id,
        userId: memberUser.id
      });

      expect(authorPermissions.edit_isPublic).toBe(true);
      expect(adminPermissions.edit_isPublic).toBe(true);
      expect(memberPermissions.edit_isPublic).toBe(false);

      // Since we're already computing all the permissions, we might as well test visibility
      if (proposalStatus === 'draft') {
        expect(authorPermissions.read).toBe(true);
        expect(adminPermissions.read).toBe(true);
        expect(memberPermissions.read).toBe(false);
      } else {
        // eslint-disable-next-line no-loop-func
        [authorPermissions, adminPermissions, memberPermissions].forEach((permissions) => {
          expect(permissions.read).toBe(true);
        });
      }
    }
  });
});
