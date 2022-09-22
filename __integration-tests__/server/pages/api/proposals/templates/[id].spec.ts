import type { Space, User } from '@prisma/client';
import { createProposalTemplate } from 'lib/templates/proposals/createProposalTemplate';
import request from 'supertest';
import { baseUrl, loginUser } from 'testing/mockApiCall';
import { generateSpaceUser, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

let adminUser: User;
let nonAdminUser: User;
let space: Space;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken(undefined, true);

  adminUser = generated.user;
  space = generated.space;

  nonAdminUser = await generateSpaceUser({ isAdmin: false, spaceId: space.id });

});

describe('DELETE /api/proposals/templates/{templateId} - Delete a proposal template', () => {
  it('should delete a proposal template if the user is a space admin and respond with 200', async () => {

    const adminCookie = await loginUser(adminUser);

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

    const nonAdminCookie = await loginUser(nonAdminUser);

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
