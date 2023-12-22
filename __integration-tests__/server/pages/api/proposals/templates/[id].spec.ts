import type { ProposalCategory, Space } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import request from 'supertest';

import { createProposal } from 'lib/proposal/createProposal';
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

describe('DELETE /api/proposals/templates/{templateId} - Delete a proposal template', () => {
  it('should delete a proposal template if the user is a space admin and respond with 200', async () => {
    const adminCookie = await loginUser(adminUser.id);

    const proposalTemplate = await createProposal({
      evaluations: [],
      spaceId: space.id,
      userId: adminUser.id,
      categoryId: proposalCategory.id,
      pageProps: {
        type: 'proposal_template'
      }
    });

    await request(baseUrl)
      .delete(`/api/proposals/templates/${proposalTemplate.proposal.id}`)
      .set('Cookie', adminCookie)
      .expect(200);
  });

  it('should fail if the user is not a space admin and respond with 401', async () => {
    const nonAdminCookie = await loginUser(nonAdminUser.id);

    const proposalTemplate = await createProposal({
      evaluations: [],
      spaceId: space.id,
      userId: adminUser.id,
      categoryId: proposalCategory.id,
      pageProps: {
        type: 'proposal_template'
      }
    });

    await request(baseUrl)
      .delete(`/api/proposals/templates/${proposalTemplate.proposal.id}`)
      .set('Cookie', nonAdminCookie)
      .expect(401);
  });
});
