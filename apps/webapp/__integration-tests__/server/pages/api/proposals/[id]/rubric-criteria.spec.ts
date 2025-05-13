import type { Space, User } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsProposals, testUtilsUser } from '@charmverse/core/test';
import { baseUrl, loginUser } from '@packages/testing/mockApiCall';
import request from 'supertest';

import type { RubricCriteriaTyped } from '@packages/lib/proposals/rubric/interfaces';
import type { RubricCriteriaUpsert } from '@packages/lib/proposals/rubric/upsertRubricCriteria';

describe('PUT /api/proposals/[id]/rubric-criteria - Update proposal rubric criteria', () => {
  it('should allow a user with permissions to update proposal rubric criteria, and respond with 200', async () => {
    const { space, user: author } = await testUtilsUser.generateUserAndSpace({ isAdmin: false, spacePaidTier: 'free' });
    const authorCookie = await loginUser(author.id);

    const proposal = await rubricProposal({
      spaceId: space.id,
      userId: author.id
    });

    const updateContent: RubricCriteriaUpsert = {
      proposalId: proposal.id,
      evaluationId: proposal.evaluations[0].id,
      rubricCriteria: [{ title: 'demo', type: 'range', parameters: { max: 4, min: 1 } }]
    };

    await request(baseUrl)
      .put(`/api/proposals/${proposal.id}/rubric-criteria`)
      .set('Cookie', authorCookie)
      .send(updateContent)
      .expect(200);
  });

  it('should prevent a user without permissions from updating the criteria, and respond with 401', async () => {
    const { space, user: author } = await testUtilsUser.generateUserAndSpace({ isAdmin: false, spacePaidTier: 'free' });
    const proposal = await rubricProposal({
      spaceId: space.id,
      userId: author.id
    });

    const spaceMember = await testUtilsUser.generateSpaceUser({ spaceId: space.id });

    const memberCookie = await loginUser(spaceMember.id);

    const updateContent: RubricCriteriaUpsert = {
      proposalId: proposal.id,
      evaluationId: proposal.evaluations[0].id,
      rubricCriteria: [{ title: 'demo', type: 'range', parameters: { max: 4, min: 1 } }]
    };

    await request(baseUrl)
      .put(`/api/proposals/${proposal.id}/rubric-criteria`)
      .set('Cookie', memberCookie)
      .send(updateContent)
      .expect(401);
  });

  it('should prevent a user from updating the criteria when using a template, and respond with 401', async () => {
    const generated = await testUtilsUser.generateUserAndSpace({ isAdmin: false, spacePaidTier: 'free' });

    const proposalTemplate = await rubricProposal({
      spaceId: generated.space.id,
      userId: generated.user.id
    });

    // TODO: allow passing this in to test generator
    await prisma.page.update({
      where: {
        id: proposalTemplate.page.id
      },
      data: {
        type: 'proposal_template'
      }
    });

    const proposalFromTemplate = await rubricProposal({
      spaceId: generated.space.id,
      userId: generated.user.id
    });

    // TODO: allow passing this in to test generator
    await prisma.page.update({
      where: {
        id: proposalFromTemplate.page.id
      },
      data: {
        sourceTemplateId: proposalTemplate.page.id
      }
    });

    const updateContent: RubricCriteriaUpsert = {
      proposalId: proposalFromTemplate.id,
      evaluationId: proposalFromTemplate.evaluations[0].id,
      rubricCriteria: [{ title: 'demo', type: 'range', parameters: { max: 4, min: 1 } }]
    };

    const memberCookie = await loginUser(generated.user.id);
    await request(baseUrl)
      .put(`/api/proposals/${proposalFromTemplate.id}/rubric-criteria`)
      .set('Cookie', memberCookie)
      .send(updateContent)
      .expect(401);
  });
});

function rubricProposal({ userId, spaceId }: { userId: string; spaceId: string }) {
  return testUtilsProposals.generateProposal({
    spaceId,
    userId,
    authors: [userId],
    proposalStatus: 'draft',
    evaluationInputs: [
      {
        evaluationType: 'rubric',
        title: 'Rubric',
        reviewers: [],
        permissions: [],
        rubricCriteria: [
          {
            title: 'demo',
            type: 'range',
            parameters: {
              max: 4,
              min: 1
            }
          } as RubricCriteriaTyped
        ]
      }
    ]
  });
}
