import type { SpaceRole } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsProposals } from '@charmverse/core/test';
import { v4 } from 'uuid';

import { createUserFromWallet } from 'lib/users/createUser';
import { createVote, generateRoleWithSpaceRole, generateUserAndSpace } from 'testing/setupDatabase';

import { getProposalTasks } from '../getProposalTasks';

describe('getProposalTasks', () => {
  it('Should only return non deleted proposals', async () => {
    const { user, space } = await generateUserAndSpace();

    // This proposal page was deleted, this shouldn't be fetched
    await testUtilsProposals.generateProposal({
      proposalStatus: 'draft',
      spaceId: space.id,
      authors: [user.id],
      reviewers: [],
      userId: user.id,
      deletedAt: new Date()
    });

    const privateDraftProposal1 = await testUtilsProposals.generateProposal({
      proposalStatus: 'discussion',
      spaceId: space.id,
      authors: [user.id],
      reviewers: [],
      userId: user.id
    });

    const proposalTasks = await getProposalTasks(user.id);

    expect(proposalTasks.unmarked).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          status: privateDraftProposal1.status,
          action: 'start_review'
        })
      ])
    );
  });
  it('Should ignore proposals marked as archived', async () => {
    const { user, space } = await generateUserAndSpace();

    // This proposal page was archived, this shouldn't be fetched
    await testUtilsProposals.generateProposal({
      proposalStatus: 'draft',
      spaceId: space.id,
      authors: [user.id],
      reviewers: [],
      userId: user.id,
      archived: true
    });

    const privateDraftProposal1 = await testUtilsProposals.generateProposal({
      proposalStatus: 'discussion',
      spaceId: space.id,
      authors: [user.id],
      reviewers: [],
      userId: user.id
    });

    const proposalTasks = await getProposalTasks(user.id);

    expect(proposalTasks.unmarked).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          status: privateDraftProposal1.status,
          action: 'start_review'
        })
      ])
    );
  });

  it('Should not get draft and private draft proposals where the user is one of the authors', async () => {
    const { user, space } = await generateUserAndSpace();
    const user2 = await createUserFromWallet();

    await testUtilsProposals.generateProposal({
      proposalStatus: 'draft',
      spaceId: space.id,
      authors: [user.id],
      reviewers: [],
      userId: user.id
    });

    await testUtilsProposals.generateProposal({
      proposalStatus: 'draft',
      spaceId: space.id,
      authors: [user.id],
      reviewers: [],
      userId: user.id
    });

    // This shouldn't be returned as the user is not an author
    await testUtilsProposals.generateProposal({
      proposalStatus: 'draft',
      spaceId: space.id,
      authors: [user2.id],
      reviewers: [],
      userId: user2.id
    });

    const proposalTasks = await getProposalTasks(user.id);

    expect(proposalTasks.unmarked.length).toEqual(0);
  });

  it('Should get all reviewed proposals where the user is one of the authors', async () => {
    const { user, space } = await generateUserAndSpace();
    const user2 = await createUserFromWallet();

    const reviewedProposal1 = await testUtilsProposals.generateProposal({
      proposalStatus: 'reviewed',
      spaceId: space.id,
      authors: [user.id],
      reviewers: [],
      userId: user.id
    });

    await testUtilsProposals.generateProposal({
      proposalStatus: 'reviewed',
      spaceId: space.id,
      authors: [user2.id],
      reviewers: [],
      userId: user2.id
    });

    const proposalTasks = await getProposalTasks(user.id);

    expect(proposalTasks.unmarked).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          status: reviewedProposal1.status,
          action: 'start_vote'
        })
      ])
    );
  });

  it('Should get all proposals to review where the user is one of the reviewer through both roleId and userId', async () => {
    const { user, space } = await generateUserAndSpace();
    const user2 = await createUserFromWallet();
    const spaceRoles = await prisma.spaceRole.findMany({
      where: {
        spaceId: space.id
      }
    });

    const { role } = await generateRoleWithSpaceRole({
      spaceId: space.id,
      createdBy: user.id,
      spaceRoleId: (spaceRoles.find((spaceRole) => spaceRole.userId === user.id) as SpaceRole).id
    });

    const proposalToReviewViaRole = await testUtilsProposals.generateProposal({
      proposalStatus: 'review',
      spaceId: space.id,
      authors: [user2.id],
      reviewers: [{ group: 'role', id: role.id }],
      userId: user2.id
    });

    const proposalToReviewViaUser = await testUtilsProposals.generateProposal({
      proposalStatus: 'review',
      spaceId: space.id,
      authors: [user2.id],
      reviewers: [{ group: 'user', id: user.id }],
      userId: user2.id
    });

    await testUtilsProposals.generateProposal({
      proposalStatus: 'review',
      spaceId: space.id,
      authors: [user.id],
      reviewers: [],
      userId: user.id
    });

    const proposalTasks = await getProposalTasks(user.id);

    expect(proposalTasks.unmarked).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          status: proposalToReviewViaRole.status,
          action: 'review'
        }),
        expect.objectContaining({
          status: proposalToReviewViaUser.status,
          action: 'review'
        })
      ])
    );
  });

  it('Should get all proposals in discussion and active vote stage where the user is a member of the proposal space', async () => {
    const { user, space } = await generateUserAndSpace();
    const user2 = await createUserFromWallet();

    const { user: inaccessibleSpaceUser, space: inaccessibleSpace } = await generateUserAndSpace();

    // Making user2 a member of the proposal space
    await prisma.spaceRole.create({
      data: {
        userId: user2.id,
        spaceId: space.id
      }
    });

    // This shouldn't be fetched as its private draft
    await testUtilsProposals.generateProposal({
      proposalStatus: 'draft',
      spaceId: space.id,
      authors: [user.id],
      reviewers: [],
      userId: user.id
    });

    const discussionProposal1 = await testUtilsProposals.generateProposal({
      proposalStatus: 'discussion',
      spaceId: space.id,
      authors: [user.id],
      reviewers: [],
      userId: user.id
    });

    const activeVoteProposal = await testUtilsProposals.generateProposal({
      proposalStatus: 'vote_active',
      spaceId: space.id,
      authors: [user.id],
      reviewers: [],
      userId: user.id
    });

    await createVote({
      createdBy: user.id,
      pageId: activeVoteProposal.id,
      spaceId: space.id,
      context: 'proposal'
    });

    const activeVoteWithUserVoteProposal = await testUtilsProposals.generateProposal({
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
      userVotes: ['1'],
      context: 'proposal'
    });

    // The user isn't an author, but it should be returned as its in discussion
    const discussionProposal2 = await testUtilsProposals.generateProposal({
      proposalStatus: 'discussion',
      spaceId: space.id,
      authors: [user2.id],
      reviewers: [],
      userId: user2.id
    });

    // This proposal is inaccessible as the user is not a member of the space
    await testUtilsProposals.generateProposal({
      proposalStatus: 'discussion',
      spaceId: inaccessibleSpace.id,
      authors: [inaccessibleSpaceUser.id],
      reviewers: [],
      userId: inaccessibleSpaceUser.id
    });

    const proposalTasks = await getProposalTasks(user.id);

    expect(proposalTasks.unmarked).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          status: discussionProposal1.status,
          action: 'start_review'
        }),
        expect.objectContaining({
          status: activeVoteProposal.status,
          action: 'vote'
        }),
        expect.objectContaining({
          status: discussionProposal2.status,
          action: 'discuss'
        })
      ])
    );

    // Making double sure private draft wasn't fetched
    expect(proposalTasks.unmarked).toEqual(
      expect.not.arrayContaining([
        expect.objectContaining({
          status: 'draft'
        })
      ])
    );
  });

  it('Should not return public notifications when disabled by the space admin', async () => {
    const { user, space } = await generateUserAndSpace({
      notifyNewProposals: null
    });

    await testUtilsProposals.generateProposal({
      proposalStatus: 'discussion',
      spaceId: space.id,
      authors: [],
      reviewers: [],
      userId: user.id
    });

    const proposalTasks = await getProposalTasks(user.id);

    expect(proposalTasks.unmarked).toEqual([]);
  });
});
