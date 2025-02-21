import { testUtilsForum, testUtilsUser } from '@charmverse/core/test';
import { stubProsemirrorDoc } from '@packages/testing/stubs/pageContent';

import type { ForumBlocksCount } from '../countForumBlocks';
import { countForumBlocks } from '../countForumBlocks';

describe('countForumBlocks', () => {
  it('should count forum categories, posts and post content blocks', async () => {
    const { space, user } = await testUtilsUser.generateUserAndSpace();
    const category = await testUtilsForum.generatePostCategory({ spaceId: space.id });
    const post1 = await testUtilsForum.generateForumPost({
      categoryId: category.id,
      userId: user.id,
      spaceId: space.id,
      content: stubProsemirrorDoc({ text: 'Example text' }),
      contentText: 'Example text'
    });
    const post2 = await testUtilsForum.generateForumPost({
      categoryId: category.id,
      userId: user.id,
      spaceId: space.id,
      content: stubProsemirrorDoc({ text: 'Another example text' }),
      contentText: 'Another example text'
    });

    const counts = await countForumBlocks({ spaceId: space.id, batchSize: 2 });

    expect(counts).toMatchObject<ForumBlocksCount>({
      total: 5,
      details: {
        categories: 1,
        postContentBlocks: 2,
        posts: 2
      }
    });
  });

  it('should ignore deleted posts', async () => {
    const { space, user } = await testUtilsUser.generateUserAndSpace();
    const category = await testUtilsForum.generatePostCategory({ spaceId: space.id });
    const post1 = await testUtilsForum.generateForumPost({
      categoryId: category.id,
      userId: user.id,
      spaceId: space.id,
      content: stubProsemirrorDoc({ text: 'Example text' }),
      contentText: 'Example text'
    });
    const post2 = await testUtilsForum.generateForumPost({
      categoryId: category.id,
      userId: user.id,
      spaceId: space.id,
      content: stubProsemirrorDoc({ text: 'Another example text' }),
      contentText: 'Another example text'
    });
    const deletedPost = await testUtilsForum.generateForumPost({
      categoryId: category.id,
      userId: user.id,
      spaceId: space.id,
      content: stubProsemirrorDoc({ text: 'Another example text' }),
      contentText: 'Another example text',
      deletedAt: new Date()
    });

    const counts = await countForumBlocks({ spaceId: space.id, batchSize: 2 });

    expect(counts).toMatchObject<ForumBlocksCount>({
      total: 5,
      details: {
        categories: 1,
        postContentBlocks: 2,
        posts: 2
      }
    });
  });

  it('should return 0 for all counts when there are no categories or posts', async () => {
    const { space } = await testUtilsUser.generateUserAndSpace();

    const counts = await countForumBlocks({ spaceId: space.id, batchSize: 2 });
    expect(counts).toMatchObject<ForumBlocksCount>({
      total: 0,
      details: {
        categories: 0,
        postContentBlocks: 0,
        posts: 0
      }
    });
  });
});
