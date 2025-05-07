import { testUtilsPages, testUtilsUser } from '@charmverse/core/test';
import { baseUrl, loginUser } from '@packages/testing/mockApiCall';
import request from 'supertest';

import { addSpaceOperations } from '@packages/lib/permissions/spaces';

describe('POST /api/pages/{id}/duplicate - Duplicate a page', () => {
  it('should allow a user to duplicate the page if they have access to create pages', async () => {
    const { user, space } = await testUtilsUser.generateUserAndSpace();
    const userCookie = await loginUser(user.id);
    const page = await testUtilsPages.generatePage({
      createdBy: user.id,
      spaceId: space.id
    });

    await addSpaceOperations({
      forSpaceId: space.id,
      spaceId: space.id,
      operations: ['createPage']
    });

    await request(baseUrl).post(`/api/pages/${page.id}/duplicate`).set('Cookie', userCookie).expect(200);
  });

  it('should not allow a user to duplicate the page if they do not have access to create pages', async () => {
    const { user, space } = await testUtilsUser.generateUserAndSpace();
    const userCookie = await loginUser(user.id);
    const page = await testUtilsPages.generatePage({
      createdBy: user.id,
      spaceId: space.id
    });

    await request(baseUrl).post(`/api/pages/${page.id}/duplicate`).set('Cookie', userCookie).expect(401);
  });
});
