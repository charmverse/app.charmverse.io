import type { Proposal, Space, User } from '@charmverse/core/prisma';
import { testUtilsProposals, testUtilsUser } from '@charmverse/core/test';
import request from 'supertest';

import type { ProposalRubricCriteriaWithTypedParams } from 'lib/proposal/rubric/interfaces';
import type { RubricCriteriaUpsert } from 'lib/proposal/rubric/upsertRubricCriteria';
import { baseUrl, loginUser } from 'testing/mockApiCall';

describe.skip('PUT /api/proposals/[id]/rubric-criteria - Update proposal rubric criteria', () => {
  let author: User;
  let space: Space;
  let proposal: Proposal;

  beforeAll(async () => {
    const generated1 = await testUtilsUser.generateUserAndSpace({ isAdmin: false, spacePaidTier: 'free' });
    space = generated1.space;
    author = generated1.user;

    proposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: author.id,
      authors: [author.id],
      proposalStatus: 'published'
    });
  });

  it('should allow a user with permissions to update proposal rubric criteria, and respond with 200', async () => {
    const authorCookie = await loginUser(author.id);

    const updateContent: RubricCriteriaUpsert = {
      proposalId: proposal.id,
      rubricCriteria: [{ title: 'demo', type: 'range', parameters: { max: 4, min: 1 } }]
    };

    await request(baseUrl)
      .put(`/api/proposals/${proposal.id}/rubric-criteria`)
      .set('Cookie', authorCookie)
      .send(updateContent)
      .expect(200);
  });

  it('should prevent a user without permissions from updating the criteria, and respond with 401', async () => {
    const updateContent: RubricCriteriaUpsert = {
      proposalId: proposal.id,
      rubricCriteria: [{ title: 'demo', type: 'range', parameters: { max: 4, min: 1 } }]
    };

    const spaceMember = await testUtilsUser.generateSpaceUser({ spaceId: space.id });

    const memberCookie = await loginUser(spaceMember.id);

    await request(baseUrl)
      .put(`/api/proposals/${proposal.id}`)
      .set('Cookie', memberCookie)
      .send(updateContent)
      .expect(401);
  });
});
