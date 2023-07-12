import type { SpaceRole } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsProposals, testUtilsUser } from '@charmverse/core/test';

import { createUserFromWallet } from 'lib/users/createUser';
import { generateRoleWithSpaceRole, generateUserAndSpace } from 'testing/setupDatabase';

import { getProposalTasks } from '../getProposalTasks';

describe('getProposalTasks', () => {
  it('Should only return non deleted proposals', async () => {
    const { user, space } = await generateUserAndSpace();

    const visibleProposalCategory = await testUtilsProposals.generateProposalCategory({
      spaceId: space.id,
      proposalCategoryPermissions: [
        {
          assignee: { group: 'space', id: space.id },
          permissionLevel: 'full_access'
        }
      ]
    });

    // This proposal page was deleted, this shouldn't be fetched
    await testUtilsProposals.generateProposal({
      proposalStatus: 'draft',
      spaceId: space.id,
      authors: [user.id],
      reviewers: [],
      userId: user.id,
      deletedAt: new Date(),
      categoryId: visibleProposalCategory.id
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
    const { user, space } = await testUtilsUser.generateUserAndSpace();
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
    const { user, space } = await testUtilsUser.generateUserAndSpace();
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
    const { user, space } = await testUtilsUser.generateUserAndSpace();
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

  it('Should get all proposals in discussion stage where the user has permission to comment inside this category', async () => {
    const { user: author, space } = await testUtilsUser.generateUserAndSpace({
      isAdmin: true
    });
    const spaceMember = await testUtilsUser.generateSpaceUser({
      spaceId: space.id
    });
    const visibleCategory = await testUtilsProposals.generateProposalCategory({
      spaceId: space.id,
      proposalCategoryPermissions: [
        {
          assignee: { group: 'space', id: space.id },
          permissionLevel: 'full_access'
        }
      ]
    });

    const hiddenCategory = await testUtilsProposals.generateProposalCategory({
      spaceId: space.id
    });

    // This shouldn't be fetched as its private draft
    await testUtilsProposals.generateProposal({
      proposalStatus: 'draft',
      spaceId: space.id,
      reviewers: [],
      userId: author.id,
      categoryId: visibleCategory.id
    });

    const discussionProposalHiddenCategory = await testUtilsProposals.generateProposal({
      proposalStatus: 'discussion',
      spaceId: space.id,
      userId: author.id,
      categoryId: hiddenCategory.id
    });

    const discussionProposalVisibleCategory = await testUtilsProposals.generateProposal({
      proposalStatus: 'discussion',
      spaceId: space.id,
      userId: author.id,
      categoryId: visibleCategory.id
    });

    const proposalTasks = await getProposalTasks(spaceMember.id);

    expect(proposalTasks.unmarked).toHaveLength(1);

    expect(proposalTasks.unmarked).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          pageId: discussionProposalVisibleCategory.page.id,
          status: discussionProposalVisibleCategory.status,
          action: 'discuss'
        })
      ])
    );
  });

  it('Should get all proposals in vote stage where the user has permission to vote inside this category', async () => {
    const { user: author, space } = await testUtilsUser.generateUserAndSpace({
      isAdmin: true
    });
    const spaceMember = await testUtilsUser.generateSpaceUser({
      spaceId: space.id
    });
    const visibleCategory = await testUtilsProposals.generateProposalCategory({
      spaceId: space.id,
      proposalCategoryPermissions: [
        {
          assignee: { group: 'space', id: space.id },
          permissionLevel: 'full_access'
        }
      ]
    });

    const hiddenCategory = await testUtilsProposals.generateProposalCategory({
      spaceId: space.id
    });

    // This shouldn't be fetched as its private draft
    await testUtilsProposals.generateProposal({
      proposalStatus: 'draft',
      spaceId: space.id,
      reviewers: [],
      userId: author.id,
      categoryId: visibleCategory.id
    });

    const votingProposalHiddenCategory = await testUtilsProposals.generateProposal({
      proposalStatus: 'vote_active',
      spaceId: space.id,
      userId: author.id,
      categoryId: hiddenCategory.id
    });

    const votingProposalVisibleCategory = await testUtilsProposals.generateProposal({
      proposalStatus: 'vote_active',
      spaceId: space.id,
      userId: author.id,
      categoryId: visibleCategory.id
    });

    const votingClosedProposalVisibleCategory = await testUtilsProposals.generateProposal({
      proposalStatus: 'vote_closed',
      spaceId: space.id,
      userId: author.id,
      categoryId: visibleCategory.id
    });

    const proposalTasks = await getProposalTasks(spaceMember.id);

    expect(proposalTasks.unmarked).toHaveLength(1);

    expect(proposalTasks.unmarked).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          pageId: votingProposalVisibleCategory.page.id,
          status: votingProposalVisibleCategory.status,
          action: 'discuss'
        })
      ])
    );
  });

  it('Should get all proposals in vote stage where the user has permission to vote inside this category', async () => {
    const { user, space } = await testUtilsUser.generateUserAndSpace({
      isAdmin: true
    });
    const secondSpaceUser = await testUtilsUser.generateSpaceUser({
      spaceId: space.id
    });

    const { user: inaccessibleSpaceUser, space: inaccessibleSpace } = await testUtilsUser.generateUserAndSpace();

    const inaccessibleSpaceProposal = await testUtilsProposals.generateProposal({
      spaceId: inaccessibleSpace.id,
      userId: inaccessibleSpaceUser.id
    });

    const visibleCategory = await testUtilsProposals.generateProposalCategory({
      spaceId: space.id,
      proposalCategoryPermissions: [
        {
          assignee: { group: 'space', id: space.id },
          permissionLevel: 'full_access'
        }
      ]
    });

    const hiddenCategory = await testUtilsProposals.generateProposalCategory({
      spaceId: space.id
    });

    // This shouldn't be fetched as its private draft
    await testUtilsProposals.generateProposal({
      proposalStatus: 'draft',
      spaceId: space.id,
      authors: [user.id],
      reviewers: [],
      userId: user.id
    });

    const discussionProposalHiddenCategory = await testUtilsProposals.generateProposal({
      proposalStatus: 'discussion',
      spaceId: space.id,
      authors: [user.id],
      reviewers: [],
      userId: user.id,
      categoryId: hiddenCategory.id
    });

    const discussionProposalVisibleCategory = await testUtilsProposals.generateProposal({
      proposalStatus: 'discussion',
      spaceId: space.id,
      authors: [user.id],
      reviewers: [],
      userId: user.id,
      categoryId: visibleCategory.id
    });

    const activeVoteProposalProposalVisibleCategory = await testUtilsProposals.generateProposal({
      proposalStatus: 'vote_active',
      spaceId: space.id,
      authors: [user.id],
      reviewers: [],
      userId: user.id,
      categoryId: visibleCategory.id
    });

    const activeVoteProposalProposalHiddenCategory = await testUtilsProposals.generateProposal({
      proposalStatus: 'vote_active',
      spaceId: space.id,
      authors: [user.id],
      reviewers: [],
      userId: user.id,
      categoryId: hiddenCategory.id
    });

    const proposalTasks = await getProposalTasks(secondSpaceUser.id);

    expect(proposalTasks.unmarked).toHaveLength(2);

    expect(proposalTasks.unmarked).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          status: discussionProposalVisibleCategory.status,
          action: 'discuss'
        }),
        expect.objectContaining({
          status: activeVoteProposalProposalVisibleCategory.status,
          action: 'vote'
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
