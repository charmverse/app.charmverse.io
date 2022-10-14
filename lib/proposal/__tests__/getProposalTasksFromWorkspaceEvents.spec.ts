import { v4 } from 'uuid';

import { prisma } from 'db';
import { createUserFromWallet } from 'lib/users/createUser';
import { generateProposal, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

import type { ProposalTask } from '../getProposalTasks';
import { getProposalTasksFromWorkspaceEvents } from '../getProposalTasksFromWorkspaceEvents';
import { updateProposalStatus } from '../updateProposalStatus';

describe('getProposalTasksFromWorkspaceEvents', () => {
  it('Return all the proposal tasks from current workspace events', async () => {
    const { user: user1, space } = await generateUserAndSpaceWithApiToken();

    const user2 = await createUserFromWallet(v4());

    await prisma.spaceRole.create({
      data: {
        spaceId: space.id,
        userId: user2.id
      }
    });

    // User is the proposal author
    // Moved a private_draft proposal from discussion back to private_draft
    // Should create two separate workspace events
    // Should create only one proposal task with action start_discussion
    const authoredDraftProposal = await generateProposal({
      authors: [user1.id],
      proposalStatus: 'private_draft',
      reviewers: [],
      spaceId: space.id,
      userId: user1.id
    });

    const { proposal: updatedProposal } = await updateProposalStatus({
      proposalId: authoredDraftProposal.proposal.id,
      newStatus: 'discussion',
      userId: user1.id
    });

    await updateProposalStatus({
      proposalId: updatedProposal.id,
      newStatus: 'private_draft',
      userId: user1.id
    });

    // User is not the proposal author but a reviewer
    // Moved a discussion stage proposal to review
    // Should create a single proposal task where action is review
    const reviewProposal = await generateProposal({
      authors: [user2.id],
      proposalStatus: 'draft',
      reviewers: [{
        group: 'user',
        id: user1.id
      }],
      spaceId: space.id,
      userId: user2.id
    });

    const { proposal: updatedReviewProposal, workspaceEvent: reviewProposalWorkspaceEvent } = await updateProposalStatus({
      proposalId: reviewProposal.proposal.id,
      newStatus: 'discussion',
      userId: user2.id
    });

    await updateProposalStatus({
      proposalId: updatedReviewProposal.id,
      newStatus: 'review',
      userId: user2.id
    });

    // User is a proposal author
    // Moved a private draft proposal to discussion
    // Should create a single proposal task with action start_review
    const authoredStartReviewProposal = await generateProposal({
      authors: [user1.id],
      proposalStatus: 'private_draft',
      reviewers: [],
      spaceId: space.id,
      userId: user1.id
    });

    await updateProposalStatus({
      proposalId: authoredStartReviewProposal.proposal.id,
      newStatus: 'discussion',
      userId: user1.id
    });

    // User is not an author or reviewer of proposal, but have access to the space
    // Move a private_draft proposal to discussion
    // Should create a single proposal task with action discuss (as a workspace member)
    const discussedProposal = await generateProposal({
      authors: [user2.id],
      proposalStatus: 'private_draft',
      reviewers: [],
      spaceId: space.id,
      userId: user2.id
    });

    await updateProposalStatus({
      proposalId: discussedProposal.proposal.id,
      newStatus: 'discussion',
      userId: user2.id
    });

    // User is an author
    // Move a review draft to reviewed
    // Single proposal task with action start_vote
    const reviewedProposal = await generateProposal({
      authors: [user1.id],
      proposalStatus: 'review',
      reviewers: [{
        group: 'user',
        id: user1.id
      }],
      spaceId: space.id,
      userId: user1.id
    });

    await updateProposalStatus({
      proposalId: reviewedProposal.proposal.id,
      newStatus: 'reviewed',
      userId: user1.id
    });

    // User is a space member
    // Move a reviewed proposal to vote_active
    // Single proposal task with action vote
    const voteActiveProposal = await generateProposal({
      authors: [user2.id],
      proposalStatus: 'reviewed',
      reviewers: [],
      spaceId: space.id,
      userId: user2.id
    });

    await updateProposalStatus({
      proposalId: voteActiveProposal.proposal.id,
      newStatus: 'vote_active',
      userId: user2.id
    });

    const { proposalTasks, unmarkedWorkspaceEvents } = await getProposalTasksFromWorkspaceEvents(user1.id, await prisma.workspaceEvent.findMany({
      where: {
        createdAt: {
          lte: new Date(),
          gte: new Date(Date.now() - 1000 * 60 * 60 * 24)
        },
        type: 'proposal_status_change'
      }
    }));

    expect(proposalTasks).toEqual(expect.arrayContaining([
      expect.objectContaining<Partial<ProposalTask>>({
        action: 'vote',
        pagePath: voteActiveProposal.path
      }),
      expect.objectContaining<Partial<ProposalTask>>({
        action: 'start_vote',
        pagePath: reviewedProposal.path
      }),
      expect.objectContaining<Partial<ProposalTask>>({
        action: 'discuss',
        pagePath: discussedProposal.path
      }),
      expect.objectContaining<Partial<ProposalTask>>({
        action: 'start_review',
        pagePath: authoredStartReviewProposal.path
      }),
      expect.objectContaining<Partial<ProposalTask>>({
        action: 'review',
        pagePath: reviewProposal.path
      })
    ]));

    expect(proposalTasks).toEqual(expect.not.arrayContaining([
      expect.objectContaining<Partial<ProposalTask>>({
        action: 'start_discussion',
        pagePath: authoredDraftProposal.path
      })
    ]));

    expect(unmarkedWorkspaceEvents).toEqual(expect.arrayContaining([
      reviewProposalWorkspaceEvent.id
    ]));
  });
});
