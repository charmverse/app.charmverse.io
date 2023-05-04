import { prisma } from '@charmverse/core';
import type { ProposalCategory, Role, Space, User } from '@charmverse/core/prisma';

import { InvalidStateError } from 'lib/middleware';
import {
  createProposalWithUsers,
  generateRole,
  generateSpaceUser,
  generateUserAndSpace,
  generateUserAndSpaceWithApiToken
} from 'testing/setupDatabase';
import { generateProposal, generateProposalCategory } from 'testing/utils/proposals';

import { updateProposalStatus } from '../updateProposalStatus';

let user: User;
let reviewer: User;
let reviewerRole: Role;
let space: Space;
let proposalCategory: ProposalCategory;

beforeAll(async () => {
  const generated = await generateUserAndSpace({
    isAdmin: false
  });
  user = generated.user;
  space = generated.space;
  reviewer = await generateSpaceUser({ spaceId: space.id, isAdmin: false });
  reviewerRole = await generateRole({ createdBy: user.id, spaceId: space.id });
  proposalCategory = await generateProposalCategory({
    spaceId: space.id
  });
});

describe('Updates the proposal of a page', () => {
  it('Move a review proposal to reviewed status and assign proposal reviewer and reviewed at fields', async () => {
    const proposal = await generateProposal({
      spaceId: space.id,
      categoryId: proposalCategory.id,
      userId: user.id,
      reviewers: [
        {
          group: 'user',
          id: reviewer.id
        }
      ],
      proposalStatus: 'review'
    });

    const { proposal: updatedProposal } = await updateProposalStatus({
      proposalId: proposal?.id as string,
      newStatus: 'reviewed',
      userId: reviewer.id
    });
    expect(updatedProposal.status).toBe('reviewed');
    expect(updatedProposal.reviewedBy).not.toBeNull();
    expect(updatedProposal.reviewedAt).not.toBeNull();
  });

  it('Move a reviewed proposal to discussion status and unassign proposal reviewer and reviewed at fields', async () => {
    const pageWithProposal = await createProposalWithUsers({
      spaceId: space.id,
      userId: user.id,
      authors: [],
      reviewers: [],
      proposalStatus: 'review'
    });

    const { proposal } = await updateProposalStatus({
      proposalId: pageWithProposal.proposal?.id as string,
      newStatus: 'discussion',
      userId: user.id
    });
    expect(proposal.status).toBe('discussion');
    expect(proposal.reviewedBy).toBeNull();
    expect(proposal.reviewedAt).toBeNull();
  });

  it('Throw error when trying to move a draft proposal to review', async () => {
    const pageWithProposal = await createProposalWithUsers({
      spaceId: space.id,
      userId: user.id,
      authors: [],
      reviewers: [],
      proposalStatus: 'reviewed'
    });
    await expect(
      updateProposalStatus({
        proposalId: pageWithProposal.proposal?.id as string,
        newStatus: 'review',
        userId: user.id
      })
    ).rejects.toBeInstanceOf(InvalidStateError);
  });

  it('Throw error when trying to move a discussion proposal to review without any reviewers attached', async () => {
    const pageWithProposal = await createProposalWithUsers({
      spaceId: space.id,
      userId: user.id,
      authors: [],
      reviewers: [],
      proposalStatus: 'discussion'
    });
    await expect(
      updateProposalStatus({
        proposalId: pageWithProposal.proposal?.id as string,
        newStatus: 'review',
        userId: user.id
      })
    ).rejects.toBeInstanceOf(InvalidStateError);
  });
  it('should save the snapshot expiry date when changing the status of the proposal to vote active if it was exported to snapshot', async () => {
    const pageWithProposal = await createProposalWithUsers({
      spaceId: space.id,
      proposalStatus: 'reviewed',
      userId: user.id,
      authors: [],
      reviewers: [reviewer.id, { type: 'role', roleId: reviewerRole.id }]
    });

    await prisma.page.update({
      where: {
        id: pageWithProposal.id
      },
      data: {
        // https://snapshot.org/#/olympusdao.eth/proposal/0x3236041d0857f7548c8da12f3890c6f590a016f02fd2f100230e1b8cbcfed078
        snapshotProposalId: '0x3236041d0857f7548c8da12f3890c6f590a016f02fd2f100230e1b8cbcfed078'
      }
    });

    const { proposal } = await updateProposalStatus({
      proposalId: pageWithProposal.proposalId as string,
      newStatus: 'vote_active',
      userId: user.id
    });

    expect(proposal.snapshotProposalExpiry?.toISOString()).toMatch('2022-10-13T20:55:51');
  });
});
