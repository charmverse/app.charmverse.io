import type { ProposalStatus, Space, User } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsProposals, testUtilsUser } from '@charmverse/core/test';

import { computePagePermissionsUsingProposalPermissions } from '../computePagePermissionsUsingProposalPermissions';

let authorUser: User;
let adminUser: User;
let memberUser: User;
let space: Space;

beforeAll(async () => {
  const generated = await testUtilsUser.generateUserAndSpace({
    isAdmin: true
  });
  adminUser = generated.user;
  space = generated.space;

  authorUser = await testUtilsUser.generateSpaceUser({
    spaceId: space.id,
    isAdmin: false
  });
  memberUser = await testUtilsUser.generateSpaceUser({
    spaceId: space.id,
    isAdmin: false
  });
});

describe('pagePermissionsWithComputeProposalPermissions', () => {
  it('should convert proposal permissions, and also account for a public-level workflow permission', async () => {
    const proposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: authorUser.id,
      proposalStatus: 'published',
      evaluationInputs: [
        {
          evaluationType: 'feedback',
          permissions: [
            { assignee: { group: 'author' }, operation: 'edit' },
            { assignee: { group: 'public' }, operation: 'view' }
          ],
          reviewers: [{ group: 'space_member' }]
        }
      ]
    });

    await prisma.pagePermission.create({
      data: {
        public: true,
        page: { connect: { id: proposal.id } },
        permissionLevel: 'view'
      }
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

    const outsidePermissions = await computePagePermissionsUsingProposalPermissions({
      resourceId: proposal.id,
      userId: undefined
    });

    expect(outsidePermissions.edit_content).toBe(false);
    expect(outsidePermissions.delete).toBe(false);
    expect(outsidePermissions.read).toBe(true);
  });

  it('should not provide a view permission for a draft proposal if a public page permission exists, but the space is using public proposals', async () => {
    const { user, space: spaceWithPublicProposals } = await testUtilsUser.generateUserAndSpace({
      publicProposals: true,
      isAdmin: false
    });

    const author = await testUtilsUser.generateSpaceUser({
      spaceId: spaceWithPublicProposals.id
    });
    const proposal = await testUtilsProposals.generateProposal({
      spaceId: spaceWithPublicProposals.id,
      userId: author.id,
      proposalStatus: 'draft'
    });

    await prisma.pagePermission.create({
      data: {
        public: true,
        page: { connect: { id: proposal.id } },
        permissionLevel: 'view'
      }
    });

    const authorPermissions = await computePagePermissionsUsingProposalPermissions({
      resourceId: proposal.id,
      userId: author.id
    });

    expect(authorPermissions.edit_content).toBe(true);
    expect(authorPermissions.delete).toBe(true);
    expect(authorPermissions.read).toBe(true);

    const memberPermissions = await computePagePermissionsUsingProposalPermissions({
      resourceId: proposal.id,
      userId: user.id
    });

    expect(memberPermissions.edit_content).toBe(false);
    expect(memberPermissions.delete).toBe(false);
    expect(memberPermissions.read).toBe(false);
  });

  it('should never allow the proposal author to make a proposal public', async () => {
    const proposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: authorUser.id,
      proposalStatus: 'published'
    });

    const proposalStatuses: ProposalStatus[] = ['draft', 'published'];

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

      expect(authorPermissions.grant_permissions).toBe(false);
    }
  });
});
