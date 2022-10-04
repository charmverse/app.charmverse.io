import type { Page } from '@prisma/client';
import request from 'supertest';

import { prisma } from 'db';
import { addSpaceOperations } from 'lib/permissions/spaces';
import { createProposalTemplate } from 'lib/templates/proposals/createProposalTemplate';
import { baseUrl, loginUser } from 'testing/mockApiCall';
import { generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

describe('POST /api/proposals/from-template - Instantiate a proposal template', () => {
  it('should copy a proposal template if the user has the space.createVotes permission and respond with 201', async () => {

    const { user: nonAdminUser, space } = await generateUserAndSpaceWithApiToken(undefined, false);

    await addSpaceOperations({
      spaceId: space.id,
      forSpaceId: space.id,
      operations: ['createVote']
    });

    const nonAdminCookie = await loginUser(nonAdminUser.id);

    const proposalTemplate = await createProposalTemplate({
      spaceId: space.id,
      userId: nonAdminUser.id,
      reviewers: [{
        group: 'user',
        id: nonAdminUser.id
      }]
    });

    const createdProposal = (await request(baseUrl)
      .post('/api/proposals/from-template')
      .set('Cookie', nonAdminCookie)
      .send({
        templateId: proposalTemplate.id,
        spaceId: space.id
      })
      .expect(201)).body as Page;

    const proposal = await prisma.proposal.findUnique({
      where: {
        id: createdProposal.proposalId as string
      },
      include: {
        reviewers: true
      }
    });

    expect(proposal?.reviewers?.some(r => r.userId === nonAdminUser.id)).toBe(true);

  });

  it('should copy a proposal template if the user is an admin, even if the space has no createVote permissions and respond with 201', async () => {

    const { user: adminUser, space } = await generateUserAndSpaceWithApiToken(undefined, true);
    const adminCookie = await loginUser(adminUser.id);

    await prisma.spacePermission.deleteMany({
      where: {
        forSpaceId: space.id
      }
    });

    const proposalTemplate = await createProposalTemplate({
      spaceId: space.id,
      userId: adminUser.id,
      reviewers: [{
        group: 'user',
        id: adminUser.id
      }]
    });

    const createdProposal = (await request(baseUrl)
      .post('/api/proposals/from-template')
      .set('Cookie', adminCookie)
      .send({
        templateId: proposalTemplate.id,
        spaceId: space.id
      })
      .expect(201)).body as Page;

    const proposal = await prisma.proposal.findUnique({
      where: {
        id: createdProposal.proposalId as string
      },
      include: {
        reviewers: true
      }
    });

    expect(proposal?.reviewers?.some(r => r.userId === adminUser.id)).toBe(true);

  });

  it('should copy a proposal template if the user does not have createVote space permission and respond with 401', async () => {

    const { user: nonAdminUser, space } = await generateUserAndSpaceWithApiToken(undefined, false);
    const nonAdminCookie = await loginUser(nonAdminUser.id);

    await prisma.spacePermission.deleteMany({
      where: {
        forSpaceId: space.id
      }
    });

    const proposalTemplate = await createProposalTemplate({
      spaceId: space.id,
      userId: nonAdminUser.id,
      reviewers: [{
        group: 'user',
        id: nonAdminUser.id
      }]
    });

    await request(baseUrl)
      .post('/api/proposals/from-template')
      .set('Cookie', nonAdminCookie)
      .send({
        templateId: proposalTemplate.id,
        spaceId: space.id
      })
      .expect(401);
  });

});
