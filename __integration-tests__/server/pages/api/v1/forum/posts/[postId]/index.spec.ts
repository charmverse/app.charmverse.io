import { prisma } from '@charmverse/core/prisma-client';
import { generateForumPosts } from '@packages/testing/forums';
import { generateSuperApiKey } from '@packages/testing/generators/apiKeys';
import { baseUrl } from '@packages/testing/mockApiCall';
import { generateUserAndSpace } from '@packages/testing/setupDatabase';
import request from 'supertest';

describe('GET /api/v1/forum/posts/[postId]', () => {
  it('should respond 200 with a forum post', async () => {
    const { space, user } = await generateUserAndSpace();

    const posts = await generateForumPosts({
      spaceId: space.id,
      createdBy: user.id,
      count: 1
    });
    const superApiKey = await generateSuperApiKey({ spaceId: space.id });
    const response = await request(baseUrl)
      .get(`/api/v1/forum/posts/${posts[0].id}`)
      .set('Authorization', superApiKey.token)
      .query({ spaceId: space.id });
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        id: posts[0].id
      })
    );
  });
});

describe('DELETE /api/v1/forum/posts', () => {
  it('should respond 200 and delete a post', async () => {
    const { space, user } = await generateUserAndSpace();

    const posts = await generateForumPosts({
      spaceId: space.id,
      createdBy: user.id,
      count: 1
    });
    const superApiKey = await generateSuperApiKey({ spaceId: space.id });
    const response = await request(baseUrl)
      .delete(`/api/v1/forum/posts/${posts[0].id}`)
      .set('Authorization', superApiKey.token)
      .query({ spaceId: space.id });
    expect(response.statusCode).toBe(200);
    const post = await prisma.post.findUnique({
      where: {
        id: posts[0].id
      }
    });
    expect(post).toEqual(null);
  });
});
