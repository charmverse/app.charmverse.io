import type { Space, User } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsProposals } from '@charmverse/core/test';
import { baseUrl, loginUser } from '@packages/testing/mockApiCall';
import { generateSpaceUser, generateUserAndSpace } from '@packages/testing/setupDatabase';
import request from 'supertest';

let adminUser: User;
let nonAdminUser: User;
let space: Space;
beforeAll(async () => {
  const generated = await generateUserAndSpace({ isAdmin: true });

  adminUser = generated.user;
  space = generated.space;

  nonAdminUser = await generateSpaceUser({ isAdmin: false, spaceId: space.id });
});

describe('GET /api/proposals/templates/{templateId} - get a proposal template', () => {
  it('should get a proposal template and respond with 200', async () => {
    const cookie = await loginUser(nonAdminUser.id);

    const proposalTemplate = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: adminUser.id,
      authors: [adminUser.id],
      pageType: 'proposal_template'
    });

    await request(baseUrl).get(`/api/proposals/templates/${proposalTemplate.id}`).set('Cookie', cookie).expect(200);
  });
  it('should get an archived proposal template if the user is a space admin and respond with 200', async () => {
    const adminCookie = await loginUser(adminUser.id);

    const proposalTemplate = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: adminUser.id,
      authors: [adminUser.id],
      pageType: 'proposal_template'
    });

    await prisma.proposal.update({
      where: {
        id: proposalTemplate.id
      },
      data: {
        archived: true
      }
    });

    await request(baseUrl)
      .get(`/api/proposals/templates/${proposalTemplate.id}`)
      .set('Cookie', adminCookie)
      .expect(200);
  });

  it('should fail if the user is not a space admin and respond with 404', async () => {
    const nonAdminCookie = await loginUser(nonAdminUser.id);

    const proposalTemplate = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: adminUser.id,
      authors: [adminUser.id],
      pageType: 'proposal_template'
    });

    await prisma.proposal.update({
      where: {
        id: proposalTemplate.id
      },
      data: {
        archived: true
      }
    });

    await request(baseUrl)
      .get(`/api/proposals/templates/${proposalTemplate.id}`)
      .set('Cookie', nonAdminCookie)
      .expect(404);
  });

  it('should get a proposal template and respond with 200 for public user', async () => {
    const proposalTemplate = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: adminUser.id,
      authors: [adminUser.id],
      pageType: 'proposal_template'
    });

    await request(baseUrl).get(`/api/proposals/templates/${proposalTemplate.id}`).expect(200);
  });
});
