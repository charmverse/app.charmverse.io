/* eslint-disable @typescript-eslint/no-unused-vars */
import request from 'supertest';
import { v4 } from 'uuid';

import type { IPageWithPermissions } from 'lib/pages';
import { addSpaceOperations } from 'lib/permissions/spaces';
import { generatePageToCreateStub } from 'testing/generate-stubs';
import { baseUrl, loginUser } from 'testing/mockApiCall';
import { generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

describe('POST /api/pages - create page', () => {

  it('should create a page if the non-admin user has the permission and return it, responding with 201', async () => {

    const { user, space } = await generateUserAndSpaceWithApiToken(v4(), false);

    await addSpaceOperations({
      forSpaceId: space.id,
      spaceId: space.id,
      operations: ['createPage']
    });

    const userCookie = await loginUser(user.id);

    const pageToCreate = generatePageToCreateStub({
      userId: user.id,
      spaceId: space.id
    });

    const { body: createdPage } = await request(baseUrl)
      .post('/api/pages')
      .set('Cookie', userCookie)
      .send(pageToCreate)
      .expect(201) as { body: IPageWithPermissions };

    expect(createdPage.spaceId).toBe(pageToCreate.spaceId as string);
    expect(createdPage.path).toBe(pageToCreate.path);
    expect(createdPage.createdBy).toBe(pageToCreate.createdBy as string);

  });

  it('should allow admins to create a page even if no permission exists, and return it, responding with 201', async () => {

    const { user, space } = await generateUserAndSpaceWithApiToken(v4(), true);

    const userCookie = await loginUser(user.id);

    const pageToCreate = generatePageToCreateStub({
      userId: user.id,
      spaceId: space.id
    });

    const { body: createdPage } = await request(baseUrl)
      .post('/api/pages')
      .set('Cookie', userCookie)
      .send(pageToCreate)
      .expect(201) as { body: IPageWithPermissions };

    expect(createdPage.spaceId).toBe(pageToCreate.spaceId as string);
    expect(createdPage.path).toBe(pageToCreate.path);
    expect(createdPage.createdBy).toBe(pageToCreate.createdBy);

  });

  it('should fail to create a page if the non-admin user does not have the permission and return it, responding with 401', async () => {

    const { user, space } = await generateUserAndSpaceWithApiToken(v4(), false);

    const userCookie = await loginUser(user.id);

    const pageToCreate = generatePageToCreateStub({
      userId: user.id,
      spaceId: space.id
    });

    await request(baseUrl)
      .post('/api/pages')
      .set('Cookie', userCookie)
      .send(pageToCreate)
      .expect(401);

  });

  it('should prevent creation of proposal templates', async () => {
    const { user, space } = await generateUserAndSpaceWithApiToken(v4(), true);

    const userCookie = await loginUser(user.id);

    await addSpaceOperations({
      forSpaceId: space.id,
      spaceId: space.id,
      operations: ['createPage', 'createVote']
    });

    const pageToCreate = generatePageToCreateStub({
      userId: user.id,
      spaceId: space.id,
      type: 'proposal_template'
    });

    await request(baseUrl)
      .post('/api/pages')
      .set('Cookie', userCookie)
      .send(pageToCreate)
      .expect(401);
  });
});

describe('POST /api/pages - create proposal page', () => {
  it('should create a proposal page if the non-admin user has the permission and return it, responding with 201', async () => {

    const { user, space } = await generateUserAndSpaceWithApiToken(v4(), false);

    await addSpaceOperations({
      forSpaceId: space.id,
      spaceId: space.id,
      operations: ['createVote']
    });

    const userCookie = await loginUser(user.id);

    const pageToCreate = generatePageToCreateStub({
      userId: user.id,
      spaceId: space.id,
      type: 'proposal'
    });

    const { body: createdPage } = await request(baseUrl)
      .post('/api/pages')
      .set('Cookie', userCookie)
      .send(pageToCreate)
      .expect(201) as { body: IPageWithPermissions };

    expect(createdPage.spaceId).toBe(pageToCreate.spaceId as string);
    expect(createdPage.path).toBe(pageToCreate.path);
    expect(createdPage.createdBy).toBe(pageToCreate.createdBy as string);

  });

  it('should allow admins to create a page even if no permission exists, and return it, responding with 201', async () => {

    const { user, space } = await generateUserAndSpaceWithApiToken(v4(), true);

    const userCookie = await loginUser(user.id);

    const pageToCreate = generatePageToCreateStub({
      userId: user.id,
      spaceId: space.id,
      type: 'proposal'
    });

    const { body: createdPage } = await request(baseUrl)
      .post('/api/pages')
      .set('Cookie', userCookie)
      .send(pageToCreate)
      .expect(201) as { body: IPageWithPermissions };

    expect(createdPage.spaceId).toBe(pageToCreate.spaceId as string);
    expect(createdPage.path).toBe(pageToCreate.path);
    expect(createdPage.createdBy).toBe(pageToCreate.createdBy);

  });

  it('should fail to create a page if the non-admin user does not have the permission and return it, responding with 401', async () => {

    const { user, space } = await generateUserAndSpaceWithApiToken(v4(), false);

    const userCookie = await loginUser(user.id);

    const pageToCreate = generatePageToCreateStub({
      userId: user.id,
      spaceId: space.id,
      type: 'proposal'
    });

    await request(baseUrl)
      .post('/api/pages')
      .set('Cookie', userCookie)
      .send(pageToCreate)
      .expect(401);

  });
});
