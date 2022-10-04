import type { Space } from '@prisma/client';
import request from 'supertest';

import { createProposalTemplate } from 'lib/templates/proposals/createProposalTemplate';
import type { LoggedInUser } from 'models';
import { baseUrl, loginUser } from 'testing/mockApiCall';
import { generateSpaceUser, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

let adminUser: LoggedInUser;
let nonAdminUser: LoggedInUser;
let space: Space;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken(undefined, true);

  adminUser = generated.user;
  space = generated.space;

  nonAdminUser = await generateSpaceUser({ isAdmin: false, spaceId: space.id });

});

describe('DELETE /api/proposals/templates/{templateId} - Delete a proposal template', () => {
  it('should delete a proposal template if the user is a space admin and respond with 200', async () => {

    const adminCookie = await loginUser(adminUser.id);

    const proposalTemplate = await createProposalTemplate({
      spaceId: space.id,
      userId: adminUser.id
    });

    await request(baseUrl)
      .delete(`/api/proposals/templates/${proposalTemplate.id}`)
      .set('Cookie', adminCookie)
      .expect(200);

  });

  it('should fail if the user is not a space admin and respond with 401', async () => {

    const nonAdminCookie = await loginUser(nonAdminUser.id);

    const proposalTemplate = await createProposalTemplate({
      spaceId: space.id,
      userId: adminUser.id
    });

    await request(baseUrl)
      .delete(`/api/proposals/templates/${proposalTemplate.id}`)
      .set('Cookie', nonAdminCookie)
      .expect(401);
  });

});
