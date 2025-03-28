import type { Proposal, Space, User } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsProposals, testUtilsUser } from '@charmverse/core/test';
import { baseUrl, loginUser } from '@packages/testing/mockApiCall';
import request from 'supertest';

import type {
  ProposalRubricCriteriaAnswerWithTypedResponse,
  RubricCriteriaTyped
} from 'lib/proposals/rubric/interfaces';
import type { RubricAnswerUpsert } from 'lib/proposals/rubric/upsertRubricAnswers';
import { upsertRubricCriteria } from 'lib/proposals/rubric/upsertRubricCriteria';

describe('PUT /api/proposals/[id]/rubric-answers - Update proposal rubric criteria answers', () => {
  let author: User;
  let reviewer: User;
  let space: Space;
  let proposal: Proposal & { evaluations: { id: string }[] };
  let rubricCriteria: RubricCriteriaTyped;

  beforeAll(async () => {
    const generated1 = await testUtilsUser.generateUserAndSpace({ isAdmin: false, spacePaidTier: 'free' });
    space = generated1.space;
    author = generated1.user;
    reviewer = await testUtilsUser.generateSpaceUser({
      spaceId: space.id
    });

    proposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: author.id,
      authors: [author.id],
      proposalStatus: 'published',
      evaluationInputs: [{ evaluationType: 'rubric', permissions: [], reviewers: [{ group: 'user', id: reviewer.id }] }]
    });

    const evaluationId = proposal.evaluations[0].id;

    const criteria = await upsertRubricCriteria({
      proposalId: proposal.id,
      evaluationId,
      rubricCriteria: [{ parameters: { max: 10, min: 1 }, title: 'score', type: 'range' }],
      actorId: author.id
    });

    rubricCriteria = criteria[0];
  });

  it('should allow a user with evaluate permissions to update their answers, and respond with 200', async () => {
    const reviewerCookie = await loginUser(reviewer.id);

    const answerContent: Pick<RubricAnswerUpsert, 'evaluationId' | 'answers'> = {
      answers: [{ rubricCriteriaId: rubricCriteria.id, response: { score: 5 }, comment: 'opinion' }],
      evaluationId: proposal.evaluations[0].id
    };

    await request(baseUrl)
      .put(`/api/proposals/${proposal.id}/rubric-answers`)
      .set('Cookie', reviewerCookie)
      .send(answerContent)
      .expect(200);

    const updated = await prisma.proposalRubricCriteriaAnswer.findMany({
      where: {
        userId: reviewer.id,
        proposalId: proposal.id
      }
    });

    expect(updated).toHaveLength(1);

    expect(updated[0]).toMatchObject<ProposalRubricCriteriaAnswerWithTypedResponse>(
      expect.objectContaining({
        ...answerContent.answers[0],
        userId: reviewer.id,
        proposalId: proposal.id,
        comment: 'opinion'
      })
    );
  });

  it('should prevent a user without evaluate permissions from submitting an answer, and respond with 401', async () => {
    const answerContent: Pick<RubricAnswerUpsert, 'evaluationId' | 'answers'> = {
      evaluationId: proposal.evaluations[0].id,
      answers: [{ rubricCriteriaId: rubricCriteria.id, response: { score: 5 } }]
    };

    const spaceMember = await testUtilsUser.generateSpaceUser({ spaceId: space.id });

    const memberCookie = await loginUser(spaceMember.id);

    await request(baseUrl)
      .put(`/api/proposals/${proposal.id}/rubric-answers`)
      .set('Cookie', memberCookie)
      .send(answerContent)
      .expect(401);
  });
});

describe('DELETE /api/proposals/[id]/rubric-answers - Delete proposal rubric criteria answers', () => {
  let author: User;
  let reviewer: User;
  let space: Space;
  let proposal: Proposal & { evaluations: { id: string }[] };
  let rubricCriteria: RubricCriteriaTyped;

  beforeAll(async () => {
    const generated1 = await testUtilsUser.generateUserAndSpace({ isAdmin: false, spacePaidTier: 'free' });
    space = generated1.space;
    author = generated1.user;
    reviewer = await testUtilsUser.generateSpaceUser({
      spaceId: space.id
    });

    proposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: author.id,
      authors: [author.id],
      proposalStatus: 'published',
      evaluationInputs: [{ evaluationType: 'rubric', permissions: [], reviewers: [{ group: 'user', id: reviewer.id }] }]
    });

    const evaluationId = proposal.evaluations[0].id;

    const criteria = await upsertRubricCriteria({
      proposalId: proposal.id,
      evaluationId,
      rubricCriteria: [{ parameters: { max: 10, min: 1 }, title: 'score', type: 'range' }],
      actorId: author.id
    });

    rubricCriteria = criteria[0];
  });

  it('should allow a user with evaluate permissions to delete their answers, and respond with 200', async () => {
    const reviewerCookie = await loginUser(reviewer.id);

    const answerContent: Pick<RubricAnswerUpsert, 'evaluationId' | 'answers'> = {
      answers: [{ rubricCriteriaId: rubricCriteria.id, response: { score: 5 } }],
      evaluationId: proposal.evaluations[0].id
    };

    // Submit answers first
    await request(baseUrl)
      .put(`/api/proposals/${proposal.id}/rubric-answers`)
      .set('Cookie', reviewerCookie)
      .send(answerContent)
      .expect(200);

    await request(baseUrl)
      .delete(`/api/proposals/${proposal.id}/rubric-answers`)
      .set('Cookie', reviewerCookie)
      .expect(200);

    const response = await prisma.proposalRubricCriteriaAnswer.findFirst({
      where: {
        userId: reviewer.id,
        rubricCriteriaId: rubricCriteria.id
      }
    });

    expect(response).toBeNull();
  });

  it('should prevent a user without evaluate permissions from deleting responses, and respond with 401', async () => {
    const spaceMember = await testUtilsUser.generateSpaceUser({ spaceId: space.id });

    const memberCookie = await loginUser(spaceMember.id);

    await request(baseUrl)
      .delete(`/api/proposals/${proposal.id}/rubric-answers`)
      .set('Cookie', memberCookie)
      .expect(401);
  });
});
