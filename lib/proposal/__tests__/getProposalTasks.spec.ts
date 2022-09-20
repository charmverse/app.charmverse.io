import type { SpaceRole } from '@prisma/client';
import { prisma } from 'db';
import { createUserFromWallet } from 'lib/users/createUser';
import { createVote, generateProposal, generateRoleWithSpaceRole, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { v4 } from 'uuid';
import { getProposalTasks } from '../getProposalTasks';

describe('getProposalTasks', () => {
  it('Should only return non archived proposals', async () => {
    const { user, space } = await generateUserAndSpaceWithApiToken();

    // This proposal page was archived, this shouldn't be fetched
    const archivedProposal = await generateProposal({
      proposalStatus: 'draft',
      spaceId: space.id,
      authors: [user.id],
      reviewers: [],
      userId: user.id,
      deletedAt: new Date()
    });

    const privateDraftProposal1 = await generateProposal({
      proposalStatus: 'private_draft',
      spaceId: space.id,
      authors: [user.id],
      reviewers: [],
      userId: user.id
    });

    const proposalTasks = await getProposalTasks(user.id);

    expect(proposalTasks).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: privateDraftProposal1.id,
        status: privateDraftProposal1.proposal?.status,
        action: 'start_discussion'
      })
    ]));

    expect(proposalTasks).not.toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: archivedProposal.id
      })
    ]));
  });

  it('Should get draft and private draft proposals where the user is one of the authors', async () => {
    const { user, space } = await generateUserAndSpaceWithApiToken();
    const user2 = await createUserFromWallet(v4());

    const draftProposal1 = await generateProposal({
      proposalStatus: 'draft',
      spaceId: space.id,
      authors: [user.id],
      reviewers: [],
      userId: user.id
    });

    const privateDraftProposal1 = await generateProposal({
      proposalStatus: 'private_draft',
      spaceId: space.id,
      authors: [user.id],
      reviewers: [],
      userId: user.id
    });

    // This shouldn't be returned as the user is not an author
    await generateProposal({
      proposalStatus: 'draft',
      spaceId: space.id,
      authors: [user2.id],
      reviewers: [],
      userId: user2.id
    });

    const proposalTasks = await getProposalTasks(user.id);

    expect(proposalTasks).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: draftProposal1.id,
        status: draftProposal1.proposal?.status,
        action: 'start_discussion'
      }),
      expect.objectContaining({
        id: privateDraftProposal1.id,
        status: privateDraftProposal1.proposal?.status,
        action: 'start_discussion'
      })
    ]));
  });

  it('Should get all reviewed proposals where the user is one of the authors', async () => {
    const { user, space } = await generateUserAndSpaceWithApiToken();
    const user2 = await createUserFromWallet(v4());

    const reviewedProposal1 = await generateProposal({
      proposalStatus: 'reviewed',
      spaceId: space.id,
      authors: [user.id],
      reviewers: [],
      userId: user.id
    });

    await generateProposal({
      proposalStatus: 'reviewed',
      spaceId: space.id,
      authors: [user2.id],
      reviewers: [],
      userId: user2.id
    });

    const proposalTasks = await getProposalTasks(user.id);

    expect(proposalTasks).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: reviewedProposal1.id,
        status: reviewedProposal1.proposal?.status,
        action: 'start_vote'
      })
    ]));
  });

  it('Should get all proposals to review where the user is one of the reviewer through both roleId and userId', async () => {
    const { user, space } = await generateUserAndSpaceWithApiToken();
    const user2 = await createUserFromWallet(v4());

    const { role } = await generateRoleWithSpaceRole({
      spaceId: space.id,
      createdBy: user.id,
      spaceRoleId: (space.spaceRoles.find(spaceRole => spaceRole.userId === user.id) as SpaceRole).id
    });

    const proposalToReviewViaRole = await generateProposal({
      proposalStatus: 'review',
      spaceId: space.id,
      authors: [user2.id],
      reviewers: [{ group: 'role', id: role.id }],
      userId: user2.id
    });

    const proposalToReviewViaUser = await generateProposal({
      proposalStatus: 'review',
      spaceId: space.id,
      authors: [user2.id],
      reviewers: [{ group: 'user', id: user.id }],
      userId: user2.id
    });

    await generateProposal({
      proposalStatus: 'review',
      spaceId: space.id,
      authors: [user.id],
      reviewers: [],
      userId: user.id
    });

    const proposalTasks = await getProposalTasks(user.id);

    expect(proposalTasks).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: proposalToReviewViaRole.id,
        status: proposalToReviewViaRole.proposal?.status,
        action: 'review'
      }),
      expect.objectContaining({
        id: proposalToReviewViaUser.id,
        status: proposalToReviewViaUser.proposal?.status,
        action: 'review'
      })
    ]));
  });

  it('Should get all proposals in discussion and active vote stage where the user is a contributor of the proposal space', async () => {
    const { user, space } = await generateUserAndSpaceWithApiToken();
    const user2 = await createUserFromWallet(v4());

    const { user: inaccessibleSpaceUser, space: inaccessibleSpace } = await generateUserAndSpaceWithApiToken();

    // Making user2 a contributor of the proposal space
    await prisma.spaceRole.create({
      data: {
        userId: user2.id,
        spaceId: space.id
      }
    });

    const discussionProposal1 = await generateProposal({
      proposalStatus: 'discussion',
      spaceId: space.id,
      authors: [user.id],
      reviewers: [],
      userId: user.id
    });

    const activeVoteProposal = await generateProposal({
      proposalStatus: 'vote_active',
      spaceId: space.id,
      authors: [user.id],
      reviewers: [],
      userId: user.id
    });

    await createVote({
      createdBy: user.id,
      pageId: activeVoteProposal.id,
      spaceId: space.id
    });

    const activeVoteWithUserVoteProposal = await generateProposal({
      proposalStatus: 'vote_active',
      spaceId: space.id,
      authors: [user.id],
      reviewers: [],
      userId: user.id
    });

    // User has voted on this proposal
    // So this shouldn't be returned as a proposal task
    await createVote({
      createdBy: user.id,
      pageId: activeVoteWithUserVoteProposal.id,
      spaceId: space.id,
      userVotes: ['1']
    });

    // The user isn't an author, but it should be returned as its in discussion
    const discussionProposal2 = await generateProposal({
      proposalStatus: 'discussion',
      spaceId: space.id,
      authors: [user2.id],
      reviewers: [],
      userId: user2.id
    });

    // This proposal is inaccessible as the user is not a contributor of the space
    await generateProposal({
      proposalStatus: 'discussion',
      spaceId: inaccessibleSpace.id,
      authors: [inaccessibleSpaceUser.id],
      reviewers: [],
      userId: inaccessibleSpaceUser.id
    });

    const proposalTasks = await getProposalTasks(user.id);

    expect(proposalTasks).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: discussionProposal1.id,
        status: discussionProposal1.proposal?.status,
        action: 'start_review'
      }),
      expect.objectContaining({
        id: activeVoteProposal.id,
        status: activeVoteProposal.proposal?.status,
        action: 'vote'
      }),
      expect.objectContaining({
        id: discussionProposal2.id,
        status: discussionProposal2.proposal?.status,
        action: 'start_review'
      })
    ]));
  });
});
