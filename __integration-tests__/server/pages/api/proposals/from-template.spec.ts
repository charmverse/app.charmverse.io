import type { Page } from '@prisma/client';
import { SpaceOperation } from '@prisma/client';
import { addSpaceOperations, removeSpaceOperations } from 'lib/permissions/spaces';
import { createProposalTemplate } from 'lib/templates/proposals/createProposalTemplate';
import { typedKeys } from 'lib/utilities/objects';
import request from 'supertest';
import { baseUrl, loginUser } from 'testing/mockApiCall';
import { generateSpaceUser, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { prisma } from 'db';

describe('POST /api/proposals/from-template - Instantiate a proposal template', () => {
  it('should copy a proposal template if the user can create pages and respond with 201', async () => {

    const { user: adminUser, space } = await generateUserAndSpaceWithApiToken(undefined, true);
    const nonAdminUser = await generateSpaceUser({ isAdmin: false, spaceId: space.id });

    await addSpaceOperations({
      spaceId: space.id,
      forSpaceId: space.id,
      operations: ['createPage']
    });

    const nonAdminCookie = await loginUser(nonAdminUser);

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

    expect(proposal?.reviewers?.some(r => r.userId === adminUser.id)).toBe(true);

  });

  it('should fail if the user does not have create pages space permission and respond with 401', async () => {

    const { user: adminUser, space } = await generateUserAndSpaceWithApiToken(undefined, true);
    const nonAdminUser = await generateSpaceUser({ isAdmin: false, spaceId: space.id });

    // Remove all space permissions
    await removeSpaceOperations({
      spaceId: space.id,
      forSpaceId: space.id,
      operations: typedKeys(SpaceOperation)
    });

    const nonAdminCookie = await loginUser(nonAdminUser);

    const proposalTemplate = await createProposalTemplate({
      spaceId: space.id,
      userId: adminUser.id,
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
