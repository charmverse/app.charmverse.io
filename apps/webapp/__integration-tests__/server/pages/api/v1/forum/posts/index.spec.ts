import { generateForumPosts } from '@packages/testing/forums';
import { generateSuperApiKey } from '@packages/testing/generators/apiKeys';
import { baseUrl } from '@packages/testing/mockApiCall';
import { generateUserAndSpace } from '@packages/testing/setupDatabase';
import { generatePostCategory } from '@packages/testing/utils/forums';
import request from 'supertest';

describe('GET /api/v1/forum/posts', () => {
  it('should respond 401 when api token is missing or invalid', async () => {
    const response = await request(baseUrl).get('/api/v1/forum/posts');

    expect(response.statusCode).toBe(401);

    const response2 = await request(baseUrl).get('/api/v1/forum/posts').set('Authorization', 'Bearer invalid-token');

    expect(response2.statusCode).toBe(401);
  });

  it('should respond 200 with posts', async () => {
    const { space, user } = await generateUserAndSpace();

    await generateForumPosts({
      spaceId: space.id,
      createdBy: user.id,
      count: 40
    });
    const superApiKey = await generateSuperApiKey({ spaceId: space.id });
    const response = await request(baseUrl)
      .get('/api/v1/forum/posts')
      .set('Authorization', superApiKey.token)
      .query({ spaceId: space.id });
    expect(response.statusCode).toBe(200);
    expect(response.body.posts).toHaveLength(5);
    expect(response.body.nextPage).toEqual(1);
  });
  it('should respect count and page in the query', async () => {
    const { space, user } = await generateUserAndSpace();

    await generateForumPosts({
      spaceId: space.id,
      createdBy: user.id,
      count: 40
    });
    const superApiKey = await generateSuperApiKey({ spaceId: space.id });

    // get 2nd list of pages
    const response2 = await request(baseUrl)
      .get('/api/v1/forum/posts')
      .set('Authorization', superApiKey.token)
      .query({ spaceId: space.id, count: 10, page: 1 });
    expect(response2.statusCode).toBe(200);
    expect(response2.body.posts).toHaveLength(10);
    expect(response2.body.nextPage).toEqual(2);
  });
});

describe('POST /api/v1/forum/posts', () => {
  it('should respond 401 when api token is missing or invalid', async () => {
    const response = await request(baseUrl).post('/api/v1/forum/posts');

    expect(response.statusCode).toBe(401);

    const response2 = await request(baseUrl).post('/api/v1/forum/posts').set('Authorization', 'Bearer invalid-token');

    expect(response2.statusCode).toBe(401);
  });

  it('should respond 200 with resulting post', async () => {
    const { space, user } = await generateUserAndSpace();

    const category = await generatePostCategory({
      spaceId: space.id
    });
    const superApiKey = await generateSuperApiKey({ spaceId: space.id });
    const response = await request(baseUrl)
      .post('/api/v1/forum/posts')
      .set('Authorization', superApiKey.token)
      .send({
        contentMarkdown: 'first line of text',
        userId: user.id,
        spaceId: space.id,
        title: 'Test',
        categoryId: category.id
      })
      .query({ spaceId: space.id });

    expect(response.statusCode).toBe(200);

    expect(response.body).toMatchObject(
      expect.objectContaining({
        author: expect.any(Object),
        category: expect.objectContaining({ id: category.id }),
        id: expect.any(String),
        content: expect.any(Object),
        title: 'Test'
      })
    );
  });
});
