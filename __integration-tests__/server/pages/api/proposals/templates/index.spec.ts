import { prisma } from '@charmverse/core';
import type { ProposalCategory, Space } from '@charmverse/core/prisma';
import request from 'supertest';

import type { PageWithProposal } from 'lib/pages';
import type { LoggedInUser } from 'models';
import { baseUrl, loginUser } from 'testing/mockApiCall';
import { generateSpaceUser, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { generateProposalCategory } from 'testing/utils/proposals';

let adminUser: LoggedInUser;
let nonAdminUser: LoggedInUser;
let space: Space;
let proposalCategory: ProposalCategory;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken(undefined, true);

  adminUser = generated.user;
  space = generated.space;

  nonAdminUser = await generateSpaceUser({ isAdmin: false, spaceId: space.id });
  proposalCategory = await generateProposalCategory({ spaceId: space.id });
  // Add this to ensure the user has access to the proposal category, but admin level is required
  await prisma.proposalCategoryPermission.create({
    data: {
      permissionLevel: 'full_access',
      space: { connect: { id: space.id } },
      proposalCategory: { connect: { id: proposalCategory.id } }
    }
  });
});

describe('POST /api/proposals/templates - Create a proposal from a template', () => {
  it('should create a proposal template if the user is a space admin and respond with 201', async () => {
    const adminCookie = await loginUser(adminUser.id);

    const proposalTemplate = (
      await request(baseUrl)
        .post('/api/proposals/templates')
        .set('Cookie', adminCookie)
        .send({
          spaceId: space.id,
          categoryId: proposalCategory.id
        })
        .expect(201)
    ).body as PageWithProposal;

    expect(proposalTemplate.type === 'proposal_template').toBe(true);
  });

  it('should fail if the user is not a space admin and respond with 401', async () => {
    const nonAdminCookie = await loginUser(nonAdminUser.id);

    await request(baseUrl)
      .post('/api/proposals/templates')
      .set('Cookie', nonAdminCookie)
      .send({
        spaceId: space.id
      })
      .expect(401);
  });
});
