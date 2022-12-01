import type { Post, Space, User } from '@prisma/client';

import { createPostCategory } from 'lib/forums/categories/createPostCategory';
import { InsecureOperationError } from 'lib/utilities/errors';
import { generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

import { createForumPost } from '../createForumPost';
import type { ForumPostPage } from '../interfaces';

let space: Space;
let user: User;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken();
  space = generated.space;
  user = generated.user;
});
describe('createForumPost', () => {
  it('should create a page with a draft post', async () => {
    const createdPage = await createForumPost({
      content: {},
      contentText: '',
      createdBy: user.id,
      spaceId: space.id,
      title: 'Test',
      categoryId: null,
      galleryImage: 'image-url-1',
      headerImage: 'image-url-2'
    });

    expect(createdPage).toMatchObject(
      expect.objectContaining<Partial<ForumPostPage>>({
        id: expect.any(String),
        postId: expect.any(String),
        content: expect.any(Object),
        contentText: expect.any(String),
        post: expect.objectContaining<Partial<Post>>({
          locked: false,
          pinned: false,
          status: 'draft'
        }),
        galleryImage: 'image-url-1',
        headerImage: 'image-url-2'
      })
    );
  });

  it('should create a page with a draft post linked to a category if this is specified', async () => {
    const category = await createPostCategory({
      name: 'Test',
      spaceId: space.id
    });

    const createdPage = await createForumPost({
      content: {},
      contentText: '',
      createdBy: user.id,
      spaceId: space.id,
      title: 'Test',
      categoryId: category.id
    });

    expect(createdPage).toMatchObject(
      expect.objectContaining<Partial<ForumPostPage>>({
        id: expect.any(String),
        postId: expect.any(String),
        content: expect.any(Object),
        contentText: expect.any(String),
        post: expect.objectContaining<Partial<Post>>({
          locked: false,
          pinned: false,
          status: 'draft',
          categoryId: category.id
        })
      })
    );
  });

  it('should fail to create the post if the category is in a different space', async () => {
    const { space: secondSpace } = await generateUserAndSpaceWithApiToken();

    const otherSpaceCategory = await createPostCategory({ name: 'External', spaceId: secondSpace.id });

    await expect(
      createForumPost({
        content: {},
        contentText: '',
        createdBy: user.id,
        spaceId: space.id,
        title: 'Test',
        categoryId: otherSpaceCategory.id
      })
    ).rejects.toBeInstanceOf(InsecureOperationError);
  });
});
