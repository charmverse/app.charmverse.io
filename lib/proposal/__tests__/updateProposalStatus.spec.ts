import type { ProposalCategory, Role, Space, User } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsProposals } from '@charmverse/core/test';

import { InvalidStateError } from 'lib/middleware';
import { createProposalWithUsers, generateRole, generateSpaceUser, generateUserAndSpace } from 'testing/setupDatabase';
import { generateProposal, generateProposalCategory } from 'testing/utils/proposals';

import { updateProposalStatus } from '../updateProposalStatus';

describe('updateProposalStatus', () => {
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

    const updatedProposal = await updateProposalStatus({
      proposalId: proposal?.id as string,
      newStatus: 'reviewed',
      userId: reviewer.id
    });
    expect(updatedProposal.status).toBe('reviewed');
    expect(updatedProposal.reviewedBy).not.toBeNull();
    expect(updatedProposal.reviewedAt).not.toBeNull();
  });

  it('Move a reviewed proposal to discussion status and unassign proposal reviewer and reviewed at fields', async () => {
    const { id: proposalId } = await createProposalWithUsers({
      spaceId: space.id,
      userId: user.id,
      authors: [],
      reviewers: [],
      proposalStatus: 'review'
    });

    const proposal = await updateProposalStatus({
      proposalId,
      newStatus: 'discussion',
      userId: user.id
    });
    expect(proposal.status).toBe('discussion');
    expect(proposal.reviewedBy).toBeNull();
    expect(proposal.reviewedAt).toBeNull();
  });

  it('Throw error when trying to move a reviewed proposal to review', async () => {
    const { id: proposalId } = await createProposalWithUsers({
      spaceId: space.id,
      userId: user.id,
      authors: [],
      reviewers: [],
      proposalStatus: 'reviewed'
    });
    await expect(
      updateProposalStatus({
        proposalId,
        newStatus: 'review',
        userId: user.id
      })
    ).rejects.toBeInstanceOf(InvalidStateError);
  });

  it('Should allow reviewer to move reviewed proposal back to review', async () => {
    const { id: proposalId } = await createProposalWithUsers({
      spaceId: space.id,
      userId: user.id,
      authors: [],
      reviewers: [user.id],
      proposalStatus: 'reviewed'
    });

    const proposal = await updateProposalStatus({
      proposalId,
      newStatus: 'review',
      userId: user.id
    });

    expect(proposal.status).toBe('review');
    expect(proposal.reviewedBy).toBeNull();
    expect(proposal.reviewedAt).toBeNull();
  });

  it('Should allow reviewer to move proposal from discussion to review', async () => {
    const { id: proposalId } = await createProposalWithUsers({
      spaceId: space.id,
      userId: user.id,
      authors: [],
      reviewers: [user.id],
      proposalStatus: 'discussion'
    });

    const proposal = await updateProposalStatus({
      proposalId,
      newStatus: 'review',
      userId: user.id
    });

    expect(proposal.status).toBe('review');
    expect(proposal.reviewedBy).toBeNull();
    expect(proposal.reviewedAt).toBeNull();
  });

  it('Should allow reviewer to move proposal from reviewed to vote_active', async () => {
    const { id: proposalId } = await createProposalWithUsers({
      spaceId: space.id,
      userId: user.id,
      authors: [],
      reviewers: [user.id],
      proposalStatus: 'reviewed'
    });

    const proposal = await updateProposalStatus({
      proposalId,
      newStatus: 'vote_active',
      userId: user.id
    });

    expect(proposal.status).toBe('vote_active');
  });

  it('Throw error when trying to move a discussion proposal to review without any reviewers attached', async () => {
    const { id: proposalId } = await createProposalWithUsers({
      spaceId: space.id,
      userId: user.id,
      authors: [],
      reviewers: [],
      proposalStatus: 'discussion'
    });
    await expect(
      updateProposalStatus({
        proposalId,
        newStatus: 'review',
        userId: user.id
      })
    ).rejects.toBeInstanceOf(InvalidStateError);
  });

  it('should throw an error if trying to update an archived proposal', async () => {
    const archivedProposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: user.id,
      authors: [],
      reviewers: [{ group: 'role', id: reviewerRole.id }],
      proposalStatus: 'discussion',
      archived: true,
      categoryId: proposalCategory.id
    });
    await expect(
      updateProposalStatus({
        proposalId: archivedProposal.id,
        newStatus: 'review',
        userId: user.id
      })
    ).rejects.toBeInstanceOf(InvalidStateError);
  });

  it('should save the snapshot expiry date when changing the status of the proposal to vote active if it was exported to snapshot', async () => {
    const { id: proposalId, pageId } = await createProposalWithUsers({
      spaceId: space.id,
      proposalStatus: 'reviewed',
      userId: user.id,
      authors: [],
      reviewers: [reviewer.id, { type: 'role', roleId: reviewerRole.id }]
    });

    await prisma.page.update({
      where: {
        id: pageId
      },
      data: {
        // https://snapshot.org/#/olympusdao.eth/proposal/0x3236041d0857f7548c8da12f3890c6f590a016f02fd2f100230e1b8cbcfed078
        snapshotProposalId: '0x3236041d0857f7548c8da12f3890c6f590a016f02fd2f100230e1b8cbcfed078'
      }
    });

    const proposal = await updateProposalStatus({
      proposalId,
      newStatus: 'vote_active',
      userId: user.id
    });

    expect(proposal.snapshotProposalExpiry?.toISOString()).toMatch('2022-10-13T20:55:51');
  });
});
