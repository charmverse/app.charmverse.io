import type { Space } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import request from 'supertest';

import { createProposal } from 'lib/proposal/createProposal';
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

describe('GET /api/proposals/templates/{templateId} - get a proposal template', () => {
  it('should get a proposal template and respond with 200', async () => {
    const cookie = await loginUser(nonAdminUser.id);

    const proposalTemplate = await createProposal({
      evaluations: [],
      spaceId: space.id,
      userId: adminUser.id,
      authors: [adminUser.id],
      pageProps: {
        type: 'proposal_template'
      }
    });

    await request(baseUrl)
      .get(`/api/proposals/templates/${proposalTemplate.proposal.id}`)
      .set('Cookie', cookie)
      .expect(200);
  });
  it('should get an archived proposal template if the user is a space admin and respond with 200', async () => {
    const adminCookie = await loginUser(adminUser.id);

    const proposalTemplate = await createProposal({
      evaluations: [],
      spaceId: space.id,
      userId: adminUser.id,
      authors: [adminUser.id],
      pageProps: {
        type: 'proposal_template'
      }
    });

    await prisma.proposal.update({
      where: {
        id: proposalTemplate.proposal.id
      },
      data: {
        archived: true
      }
    });

    await request(baseUrl)
      .get(`/api/proposals/templates/${proposalTemplate.proposal.id}`)
      .set('Cookie', adminCookie)
      .expect(200);
  });

  it('should fail if the user is not a space admin and respond with 404', async () => {
    const nonAdminCookie = await loginUser(nonAdminUser.id);

    const proposalTemplate = await createProposal({
      evaluations: [],
      spaceId: space.id,
      userId: adminUser.id,
      authors: [adminUser.id],
      pageProps: {
        type: 'proposal_template'
      }
    });

    await prisma.proposal.update({
      where: {
        id: proposalTemplate.proposal.id
      },
      data: {
        archived: true
      }
    });

    await request(baseUrl)
      .get(`/api/proposals/templates/${proposalTemplate.proposal.id}`)
      .set('Cookie', nonAdminCookie)
      .expect(404);
  });
});
