// File: __tests__/importForumPosts.test.ts

import { DataNotFoundError } from '@charmverse/core/errors';
import type { Post, PostCategory, Space, User } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsUser, testUtilsRandom, testUtilsForum } from '@charmverse/core/test';
import { v4 as uuid } from 'uuid';

import type { SpaceDataExport } from '../exportSpaceData';
import type { ForumPostImportResult } from '../importForumPosts';
import { importForumPosts } from '../importForumPosts';

describe('importForumPosts', () => {
  let user: User;
  let space: Space;
  let postCategory: PostCategory;
  let posts: Post[];
  let exportData: Pick<SpaceDataExport, 'postCategories' | 'posts'>;

  beforeAll(async () => {
    // Generate user and space
    ({ user, space } = await testUtilsUser.generateUserAndSpace({ isAdmin: true }));

    postCategory = await testUtilsForum.generatePostCategory({ spaceId: space.id });
    posts = await testUtilsForum.generateForumPosts({
      spaceId: space.id,
      count: 3,
      createdBy: user.id,
      categoryId: postCategory.id
    });

    exportData = {
      postCategories: [postCategory],
      posts
    };
  });

  it('successfully imports forum posts', async () => {
    const { space: targetSpace } = await testUtilsUser.generateUserAndSpace();
    const result = await importForumPosts({ targetSpaceIdOrDomain: targetSpace.id, exportData });

    expect(result).toMatchObject<ForumPostImportResult>({
      postCategories: expect.arrayContaining([{ ...postCategory, id: expect.any(String), spaceId: targetSpace.id }]),
      posts: expect.arrayContaining(
        posts.map((post) => ({
          ...post,
          id: expect.any(String),
          path: expect.any(String),
          spaceId: targetSpace.id,
          createdBy: targetSpace.createdBy,
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
          categoryId: expect.any(String)
        }))
      ),
      postsIdHashmap: {
        [posts[0].id]: expect.any(String),
        [posts[1].id]: expect.any(String),
        [posts[2].id]: expect.any(String)
      },
      postCategoriesIdHashMap: {
        [postCategory.id]: expect.any(String)
      }
    });
  });

  it('throws an error when no posts are found in export data', async () => {
    await expect(importForumPosts({ targetSpaceIdOrDomain: space.id, exportData: {} })).rejects.toThrow(
      DataNotFoundError
    );
  });

  afterAll(async () => {
    // Cleanup: remove the test space and user
    await prisma.space.delete({ where: { id: space.id } });
    await prisma.user.delete({ where: { id: user.id } });
  });
});
