/* eslint-disable @typescript-eslint/no-unused-vars */
import type { PageWithPermissions } from '@charmverse/core/pages';
import { testUtilsPages, testUtilsUser } from '@charmverse/core/test';
import { addSpaceOperations } from '@packages/lib/permissions/spaces/addSpaceOperations';
import { generatePageToCreateStub } from '@packages/testing/generateStubs';
import { baseUrl, loginUser } from '@packages/testing/mockApiCall';
import request from 'supertest';

describe('POST /api/pages - create page', () => {
  it('should create a root-level page if the non-admin user has the permission and return it, responding with 201', async () => {
    const { user, space } = await testUtilsUser.generateUserAndSpace({
      isAdmin: false
    });

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

    const { body: createdPage } = (await request(baseUrl)
      .post('/api/pages')
      .set('Cookie', userCookie)
      .send(pageToCreate)
      .expect(201)) as { body: PageWithPermissions };

    expect(createdPage.spaceId).toBe(pageToCreate.spaceId as string);
    expect(createdPage.path).toBe(pageToCreate.path);
    expect(createdPage.createdBy).toBe(pageToCreate.createdBy as string);
  });

  it('should allow admins to create a page even if no permission exists, and return it, responding with 201', async () => {
    const { user, space } = await testUtilsUser.generateUserAndSpace({
      isAdmin: true
    });

    const userCookie = await loginUser(user.id);

    const pageToCreate = generatePageToCreateStub({
      userId: user.id,
      spaceId: space.id
    });

    const { body: createdPage } = (await request(baseUrl)
      .post('/api/pages')
      .set('Cookie', userCookie)
      .send(pageToCreate)
      .expect(201)) as { body: PageWithPermissions };

    expect(createdPage.spaceId).toBe(pageToCreate.spaceId as string);
    expect(createdPage.path).toBe(pageToCreate.path);
    expect(createdPage.createdBy).toBe(pageToCreate.createdBy);
  });

  it('should fail to create a root-level page if the non-admin user does not have the permission and return it, responding with 401', async () => {
    const { user, space } = await testUtilsUser.generateUserAndSpace({
      isAdmin: false
    });

    const userCookie = await loginUser(user.id);

    const pageToCreate = generatePageToCreateStub({
      userId: user.id,
      spaceId: space.id
    });

    await request(baseUrl).post('/api/pages').set('Cookie', userCookie).send(pageToCreate).expect(401);
  });

  // Handle the creation of nested pages. In this case, we shouldn't depend on space permissions, but on whether you can edit the parent page
  it('should create a nested page if the non-admin user can edit the parent and return it, responding with 201', async () => {
    const { user, space } = await testUtilsUser.generateUserAndSpace({
      isAdmin: false
    });

    const otherUser = await testUtilsUser.generateSpaceUser({
      spaceId: space.id
    });

    const parentPage = await testUtilsPages.generatePage({
      createdBy: user.id,
      spaceId: space.id,
      pagePermissions: [
        {
          permissionLevel: 'full_access',
          assignee: { group: 'space', id: space.id }
        }
      ]
    });
    const pageToCreate = generatePageToCreateStub({
      userId: otherUser.id,
      spaceId: space.id,
      parentId: parentPage.id
    });

    const userCookie = await loginUser(otherUser.id);

    const { body: createdPage } = (await request(baseUrl)
      .post('/api/pages')
      .set('Cookie', userCookie)
      .send(pageToCreate)
      .expect(201)) as { body: PageWithPermissions };

    expect(createdPage.spaceId).toBe(pageToCreate.spaceId as string);
    expect(createdPage.path).toBe(pageToCreate.path);
    expect(createdPage.createdBy).toBe(pageToCreate.createdBy as string);
  });

  it('should not create a nested page if the non-admin user cannot edit the parent the permission and return it, responding with 401', async () => {
    const { user, space } = await testUtilsUser.generateUserAndSpace({
      isAdmin: false
    });

    const otherUser = await testUtilsUser.generateSpaceUser({
      spaceId: space.id
    });

    const parentPage = await testUtilsPages.generatePage({
      createdBy: user.id,
      spaceId: space.id,
      pagePermissions: [
        // Empty page permissions, so the user cannot edit the parent page
      ]
    });
    const pageToCreate = generatePageToCreateStub({
      userId: otherUser.id,
      spaceId: space.id,
      parentId: parentPage.id
    });

    const userCookie = await loginUser(otherUser.id);

    await request(baseUrl).post('/api/pages').set('Cookie', userCookie).send(pageToCreate).expect(401);
  });

  // --------------

  it('should prevent creation of proposal templates and proposals', async () => {
    const { user, space } = await testUtilsUser.generateUserAndSpace({
      isAdmin: true
    });

    const userCookie = await loginUser(user.id);

    await addSpaceOperations({
      forSpaceId: space.id,
      spaceId: space.id,
      operations: ['createPage']
    });

    const pageToCreate = generatePageToCreateStub({
      userId: user.id,
      spaceId: space.id,
      type: 'proposal_template'
    });

    await request(baseUrl).post('/api/pages').set('Cookie', userCookie).send(pageToCreate).expect(400);
    await request(baseUrl)
      .post('/api/pages')
      .set('Cookie', userCookie)
      .send({ ...pageToCreate, type: 'proposal' })
      .expect(400);
  });
});
