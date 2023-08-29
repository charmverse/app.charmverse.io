import { testUtilsForum, testUtilsPages, testUtilsUser } from '@charmverse/core/test';

import { createPage, createVote } from 'testing/setupDatabase';

import { getVoteTasks } from '../getVoteTasks';

describe('getVoteTasks', () => {
  it('should get votes tasks for a user only in the pages they have access to', async () => {
    const { space, user: adminUser } = await testUtilsUser.generateUserAndSpace({ isAdmin: true });

    const visiblePage = await testUtilsPages.generatePage({
      createdBy: adminUser.id,
      spaceId: space.id,
      pagePermissions: [
        {
          permissionLevel: 'full_access',
          assignee: { group: 'space', id: space.id }
        }
      ]
    });

    // Not included as the vote has been cancelled
    const invisibleVote = await createVote({
      pageId: visiblePage.id,
      createdBy: adminUser.id,
      spaceId: space.id,
      voteOptions: ['1', '2'],
      status: 'Cancelled',
      deadline: new Date(Date.now() + 24 * 60 * 60 * 1000)
    });

    // Included even if the vote is past deadline
    const inProgressPastDeadlineVote = await createVote({
      pageId: visiblePage.id,
      createdBy: adminUser.id,
      spaceId: space.id,
      voteOptions: ['a', 'b'],
      status: 'InProgress',
      deadline: new Date(Date.now() - 24 * 60 * 60 * 1000)
    });

    // Included since we show votes that have been casted
    const inProgressVote = await createVote({
      pageId: visiblePage.id,
      createdBy: adminUser.id,
      spaceId: space.id,
      voteOptions: ['a', 'b'],
      status: 'InProgress',
      userVotes: ['1'],
      deadline: new Date(Date.now() + 24 * 60 * 60 * 1000)
    });

    const createdVote = await createVote({
      pageId: visiblePage.id,
      createdBy: adminUser.id,
      spaceId: space.id,
      voteOptions: ['a', 'b'],
      deadline: new Date(Date.now() + 24 * 60 * 60 * 1000)
    });

    const hiddenPage = await createPage({
      createdBy: adminUser.id,
      spaceId: space.id
    });
    // Same vote conditions as above, but on a page the user cannot see
    const hiddenPageCreatedVote = await createVote({
      pageId: hiddenPage.id,
      createdBy: adminUser.id,
      spaceId: space.id,
      voteOptions: ['a', 'b'],
      deadline: new Date(Date.now() + 24 * 60 * 60 * 1000)
    });

    const spaceMember = await testUtilsUser.generateSpaceUser({ spaceId: space.id });

    const votes = await getVoteTasks(spaceMember.id);

    expect(votes.unmarked).toHaveLength(3);

    expect(votes.unmarked).toMatchObject(
      expect.arrayContaining([
        expect.objectContaining({ id: createdVote.id }),
        expect.objectContaining({ id: inProgressPastDeadlineVote.id }),
        expect.objectContaining({ id: inProgressVote.id })
      ])
    );
  });

  it('should get votes tasks for a user only in the forum posts they can comment in', async () => {
    const { space, user: adminUser } = await testUtilsUser.generateUserAndSpace({ isAdmin: true });

    const hiddenForumCategory = await testUtilsForum.generatePostCategory({
      spaceId: space.id,
      permissions: [],
      name: 'Hidden category'
    });

    const hiddenCategoryPost = await testUtilsForum.generateForumPost({
      spaceId: space.id,
      userId: adminUser.id,
      categoryId: hiddenForumCategory.id
    });

    const inProgressHiddenVote = await createVote({
      postId: hiddenCategoryPost.id,
      createdBy: adminUser.id,
      spaceId: space.id,
      voteOptions: ['a', 'b'],
      status: 'InProgress',
      userVotes: ['1'],
      deadline: new Date(Date.now() + 24 * 60 * 60 * 1000)
    });

    const viewOnlyForumCategory = await testUtilsForum.generatePostCategory({
      spaceId: space.id,
      name: 'View only category',
      permissions: [
        {
          assignee: { group: 'space', id: space.id },
          permissionLevel: 'view'
        }
      ]
    });
    const viewOnlyCategoryPost = await testUtilsForum.generateForumPost({
      spaceId: space.id,
      userId: adminUser.id,
      categoryId: viewOnlyForumCategory.id
    });

    const inProgressViewableVote = await createVote({
      postId: viewOnlyCategoryPost.id,
      createdBy: adminUser.id,
      spaceId: space.id,
      voteOptions: ['a', 'b'],
      status: 'InProgress',
      userVotes: ['1'],
      deadline: new Date(Date.now() + 24 * 60 * 60 * 1000)
    });

    const commentableForumCategory = await testUtilsForum.generatePostCategory({
      spaceId: space.id,
      name: 'Commentable category',
      permissions: [
        {
          assignee: { group: 'space', id: space.id },
          permissionLevel: 'comment_vote'
        }
      ]
    });
    const commentableCategoryPost = await testUtilsForum.generateForumPost({
      spaceId: space.id,
      userId: adminUser.id,
      categoryId: commentableForumCategory.id
    });

    const inProgressVotableVote = await createVote({
      postId: commentableCategoryPost.id,
      createdBy: adminUser.id,
      spaceId: space.id,
      voteOptions: ['a', 'b'],
      status: 'InProgress',
      userVotes: ['1'],
      deadline: new Date(Date.now() + 24 * 60 * 60 * 1000)
    });
    const spaceMember = await testUtilsUser.generateSpaceUser({ spaceId: space.id });

    const votes = await getVoteTasks(spaceMember.id);

    expect(votes.unmarked).toHaveLength(1);

    expect(votes.unmarked).toMatchObject(
      expect.arrayContaining([expect.objectContaining({ id: inProgressVotableVote.id })])
    );
  });
});
