import type { Post, Space, User } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { generateUserAndSpace, createVote } from '@packages/testing/setupDatabase';
import { generatePostCategory } from '@packages/testing/utils/forums';
import { InsecureOperationError } from '@packages/utils/errors';
import { builders } from '@root/lib/prosemirror/builders';

import { createForumPost } from '../createForumPost';

const { doc, poll } = builders;

let space: Space;
let user: User;

beforeAll(async () => {
  const generated = await generateUserAndSpace();
  space = generated.space;
  user = generated.user;
});
describe('createForumPost', () => {
  it('should create a post linked to a specific category', async () => {
    const category = await generatePostCategory({
      spaceId: space.id
    });
    const createdPage = await createForumPost({
      content: null,
      contentText: '',
      createdBy: user.id,
      spaceId: space.id,
      title: 'Test',
      categoryId: category.id,
      isDraft: false
    });

    expect(createdPage).toMatchObject(
      expect.objectContaining<Partial<Post>>({
        id: expect.any(String),
        content: expect.any(Object),
        title: 'Test',
        locked: false,
        pinned: false
      })
    );
  });

  it('should fail to create the post if the category is in a different space', async () => {
    const { space: secondSpace } = await generateUserAndSpace();

    const otherSpaceCategory = await generatePostCategory({ spaceId: secondSpace.id });

    await expect(
      createForumPost({
        content: null,
        contentText: '',
        createdBy: user.id,
        spaceId: space.id,
        title: 'Test',
        categoryId: otherSpaceCategory.id,
        isDraft: false
      })
    ).rejects.toBeInstanceOf(InsecureOperationError);
  });

  it('should update an inline poll with the postId', async () => {
    const otherSpaceCategory = await generatePostCategory({ spaceId: space.id });
    const vote = await createVote({
      createdBy: user.id,
      spaceId: space.id
    });

    const newPost = await createForumPost({
      content: doc(poll({ pollId: vote.id })).toJSON(),
      contentText: '',
      createdBy: user.id,
      spaceId: space.id,
      title: 'Test',
      categoryId: otherSpaceCategory.id,
      isDraft: false
    });

    const updatedVote = await prisma.vote.findUnique({
      where: {
        id: vote.id
      }
    });
    expect(updatedVote?.postId).toBe(newPost.id);
  });
});
