import type { PostComment } from 'prisma';

import { generateForumPost, generateForumPosts, generatePostComment } from '../forums';
import { generateUserAndSpace } from '../user';

describe('generateForumPosts', () => {
  it('should generate an arbitrary number of posts in a given space, each with their own createdAt date', async () => {
    const { space, user } = await generateUserAndSpace();

    const posts = await generateForumPosts({
      spaceId: space.id,
      createdBy: user.id,
      count: 5
    });

    expect(posts).toHaveLength(5);

    posts.forEach((post) => {
      expect(posts.some((p) => p.id !== post.id && p.createdAt === post.createdAt)).toBe(false);
    });
  });
});

describe('generatePostComment', () => {
  it('should generate a post comment, allowing to provide custom content, parentId and deletedAt', async () => {
    const commentText = 'Example content';

    const commentContent = {
      type: 'doc',
      content: commentText
    };

    const { space, user } = await generateUserAndSpace();

    const post = await generateForumPost({
      spaceId: space.id,
      userId: user.id
    });

    const comment = await generatePostComment({
      content: commentContent,
      contentText: commentText,
      postId: post.id,
      userId: user.id
    });

    expect(comment).toMatchObject<PostComment>({
      createdAt: expect.any(Date),
      createdBy: user.id,
      deletedAt: null,
      deletedBy: null,
      id: expect.any(String),
      parentId: null,
      postId: post.id,
      updatedAt: expect.any(Date),
      contentText: commentText,
      content: expect.objectContaining(commentContent)
    });

    const childComment = await generatePostComment({
      content: commentContent,
      contentText: commentText,
      postId: post.id,
      userId: user.id,
      deletedAt: new Date(),
      parentId: comment.id
    });

    expect(childComment.parentId).toBe(comment.id);
    expect(childComment.deletedAt).toBeDefined();
    // If deleted at is provided, set deleted by to user who created comment
    expect(childComment.deletedBy).toBe(user.id);
  });
});
