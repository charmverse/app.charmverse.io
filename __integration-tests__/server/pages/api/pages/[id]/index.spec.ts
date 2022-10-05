/* eslint-disable @typescript-eslint/no-unused-vars */
import request from 'supertest';

import type { IPageWithPermissions } from 'lib/pages';
import { createProposalTemplate } from 'lib/templates/proposals/createProposalTemplate';
import { baseUrl, loginUser } from 'testing/mockApiCall';
import { generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

const updateContent = {
  content: {
    paragraph: 'This is a paragraph'
  }
};

describe('PUT /api/pages/{id} - update page', () => {

  it('should update proposal template page content if the user is an admin and respond 200', async () => {

    const { user: adminUser, space } = await generateUserAndSpaceWithApiToken(undefined, true);

    const template = await createProposalTemplate({
      spaceId: space.id,
      userId: adminUser.id
    });

    const adminCookie = await loginUser(adminUser.id);

    const body = (await request(baseUrl)
      .put(`/api/pages/${template.id}`)
      .set('Cookie', adminCookie)
      .send(updateContent)
      .expect(200)).body as IPageWithPermissions;
  });

  it('should to fail update proposal template page content if the user is not a space admin and respond 401', async () => {

    const { user: nonAdminUser, space } = await generateUserAndSpaceWithApiToken(undefined, false);

    const template = await createProposalTemplate({
      spaceId: space.id,
      userId: nonAdminUser.id
    });

    const adminCookie = await loginUser(nonAdminUser.id);

    await request(baseUrl)
      .put(`/api/pages/${template.id}`)
      .set('Cookie', adminCookie)
      .send(updateContent)
      .expect(401);
  });

});
