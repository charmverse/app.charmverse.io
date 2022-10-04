import type { User, Space, ProposalStatus } from '@prisma/client';

import { prisma } from 'db';
import { InvalidStateError } from 'lib/middleware';
import type { IPageWithPermissions } from 'lib/pages/server';
import { getPage } from 'lib/pages/server';
import { createProposalWithUsers, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

import type { ProposalWithUsers } from '../interface';
import { proposalPermissionMapping } from '../syncProposalPermissions';
import { updateProposal } from '../updateProposal';

let author1: User;
let author2: User;
let reviewer1: User;
let reviewer2: User;
let space: Space;

beforeAll(async () => {
  const { user: user1, space: generatedSpace } = await generateUserAndSpaceWithApiToken();
  const { user: user2 } = await generateUserAndSpaceWithApiToken();
  const { user: user3 } = await generateUserAndSpaceWithApiToken();
  const { user: user4 } = await generateUserAndSpaceWithApiToken();

  author1 = user1;
  author2 = user2;
  reviewer1 = user3;
  reviewer2 = user4;
  space = generatedSpace;
});

describe('Update proposal specific data', () => {
  it('Update the reviewers and authors list of a proposal', async () => {
    // Create a test proposal first
    const pageWithProposal = await createProposalWithUsers({
      spaceId: space.id,
      userId: author1.id,
      authors: [],
      reviewers: [reviewer2.id]
    });

    const proposal = pageWithProposal.proposal as ProposalWithUsers;

    await updateProposal({
      proposalId: proposal.id,
      authors: [author2.id],
      reviewers: [{
        group: 'user',
        id: reviewer1.id
      }]
    });

    const [proposalReviewer1, proposalReviewer2, proposalAuthor1, proposalAuthor2] = await Promise.all([
      prisma.proposalReviewer.findUnique({
        where: {
          userId_proposalId: {
            proposalId: proposal.id,
            userId: reviewer1.id
          }
        }
      }),
      prisma.proposalReviewer.findUnique({
        where: {
          userId_proposalId: {
            proposalId: proposal.id,
            userId: reviewer2.id
          }
        }
      }),
      prisma.proposalAuthor.findUnique({
        where: {
          proposalId_userId: {
            proposalId: proposal.id,
            userId: author1.id
          }
        }
      }),
      prisma.proposalAuthor.findUnique({
        where: {
          proposalId_userId: {
            proposalId: proposal.id,
            userId: author2.id
          }
        }
      })
    ]);

    // This records should be deleted
    expect(proposalReviewer2).toBeFalsy();
    expect(proposalAuthor1).toBeFalsy();

    // This records should be created
    expect(proposalReviewer1).toBeTruthy();
    expect(proposalAuthor2).toBeTruthy();
  });

  it('Should throw error if at least one author is not selected for a proposal', async () => {
    // Create a test proposal first
    const pageWithProposal = await createProposalWithUsers({
      spaceId: space.id,
      userId: author1.id,
      authors: [],
      reviewers: [reviewer2.id]
    });

    const proposal = pageWithProposal.proposal as ProposalWithUsers;

    await expect(updateProposal({
      proposalId: proposal.id,
      authors: [],
      reviewers: [{
        group: 'user',
        id: reviewer1.id
      }]
    })).rejects.toBeInstanceOf(InvalidStateError);
  });

  it('Should assign the correct permissions when updating proposal authors and reviewers', async () => {

    const status: ProposalStatus = 'discussion';

    // Create a test proposal first
    const pageWithProposal = await createProposalWithUsers({
      spaceId: space.id,
      proposalStatus: status,
      userId: author1.id,
      authors: [],
      reviewers: []
    });

    const proposal = await updateProposal({
      proposalId: pageWithProposal.proposalId as string,
      authors: [author1.id, author2.id],
      reviewers: [{
        group: 'user',
        id: reviewer1.id
      }]
    });

    const { permissions } = await getPage(proposal.id) as IPageWithPermissions;

    const permissionTemplate = proposalPermissionMapping[status];

    if (permissionTemplate.author) {
      // Check all authors have a permission
      proposal.authors.forEach((author) => {
        if (author.userId) {
          expect(permissions.some(p => p.userId === author.userId && p.permissionLevel === permissionTemplate.author)).toBe(true);
        }
      });
    }

    if (permissionTemplate.reviewer) {
      proposal.reviewers.forEach((reviewer) => {
        expect(permissions.some(p => (reviewer.userId ? p.userId === reviewer.userId : p.roleId === reviewer.roleId)
        && p.permissionLevel === permissionTemplate.author)).toBe(true);
      });
    }

    if (permissionTemplate.community) {
      expect(permissions.some(p => p.spaceId === proposal.spaceId && p.permissionLevel === permissionTemplate.community)).toBe(true);
    }
  });
});
