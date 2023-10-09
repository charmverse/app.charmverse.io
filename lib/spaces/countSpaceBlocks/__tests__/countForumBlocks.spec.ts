import { testUtilsForum, testUtilsUser } from '@charmverse/core/test';

import { stubProsemirrorDoc } from 'testing/stubs/pageContent';

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

    expect(counts.details.categories).toBe(1);
    expect(counts.details.posts).toBe(2);
    // Assuming each post content has 1 block
    expect(counts.details.postContentBlocks).toBe(2);
  });

  it('should return 0 for all counts when there are no categories or posts', async () => {
    const { space } = await testUtilsUser.generateUserAndSpace();

    const counts = await countForumBlocks({ spaceId: space.id, batchSize: 2 });

    expect(counts.details.categories).toBe(0);
    expect(counts.details.posts).toBe(0);
    expect(counts.details.postContentBlocks).toBe(0);
  });
});
