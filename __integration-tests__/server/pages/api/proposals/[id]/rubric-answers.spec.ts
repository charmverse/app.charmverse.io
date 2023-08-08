import type { Proposal, Space, User } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsProposals, testUtilsUser } from '@charmverse/core/test';
import request from 'supertest';

import type {
  ProposalRubricCriteriaAnswerWithTypedResponse,
  ProposalRubricCriteriaWithTypedParams
} from 'lib/proposal/rubric/interfaces';
import type { RubricAnswerUpsert } from 'lib/proposal/rubric/upsertRubricAnswers';
import { upsertRubricCriteria } from 'lib/proposal/rubric/upsertRubricCriteria';
import { baseUrl, loginUser } from 'testing/mockApiCall';

describe('PUT /api/proposals/[id]/rubric-answers - Update proposal rubric criteria answers', () => {
  let author: User;
  let reviewer: User;
  let space: Space;
  let proposal: Proposal;
  let rubricCriteria: ProposalRubricCriteriaWithTypedParams;

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
      reviewers: [{ group: 'user', id: reviewer.id }],
      // This is important, we can only evaluate when evaluation is open
      proposalStatus: 'evaluation_active'
    });

    const criteria = await upsertRubricCriteria({
      proposalId: proposal.id,
      rubricCriteria: [{ parameters: { max: 10, min: 1 }, title: 'score', type: 'range' }]
    });

    rubricCriteria = criteria[0];
  });

  it('should allow a user with evaluate permissions to update their answers, and respond with 200', async () => {
    const reviewerCookie = await loginUser(reviewer.id);

    const answerContent: Pick<RubricAnswerUpsert, 'answers'> = {
      answers: [{ rubricCriteriaId: rubricCriteria.id, response: { score: 5 }, comment: 'opinion' }]
    };

    const updated = (
      await request(baseUrl)
        .put(`/api/proposals/${proposal.id}/rubric-answers`)
        .set('Cookie', reviewerCookie)
        .send(answerContent)
        .expect(200)
    ).body as ProposalRubricCriteriaAnswerWithTypedResponse[];

    expect(updated).toHaveLength(1);

    expect(updated[0]).toMatchObject<ProposalRubricCriteriaAnswerWithTypedResponse>({
      ...answerContent.answers[0],
      userId: reviewer.id,
      proposalId: proposal.id,
      comment: 'opinion'
    });
  });

  it('should prevent a user without evaluate permissions from submitting an answer, and respond with 401', async () => {
    const answerContent: Pick<RubricAnswerUpsert, 'answers'> = {
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
  let proposal: Proposal;
  let rubricCriteria: ProposalRubricCriteriaWithTypedParams;

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
      reviewers: [{ group: 'user', id: reviewer.id }],
      // This is important, we can only evaluate when evaluation is open
      proposalStatus: 'evaluation_active'
    });

    const criteria = await upsertRubricCriteria({
      proposalId: proposal.id,
      rubricCriteria: [{ parameters: { max: 10, min: 1 }, title: 'score', type: 'range' }]
    });

    rubricCriteria = criteria[0];
  });

  it('should allow a user with evaluate permissions to delete their answers, and respond with 200', async () => {
    const reviewerCookie = await loginUser(reviewer.id);

    const answerContent: Pick<RubricAnswerUpsert, 'answers'> = {
      answers: [{ rubricCriteriaId: rubricCriteria.id, response: { score: 5 } }]
    };

    // Submit answers first
    const updated = (
      await request(baseUrl)
        .put(`/api/proposals/${proposal.id}/rubric-answers`)
        .set('Cookie', reviewerCookie)
        .send(answerContent)
        .expect(200)
    ).body as ProposalRubricCriteriaWithTypedParams[];

    await request(baseUrl)
      .delete(`/api/proposals/${proposal.id}/rubric-answers`)
      .set('Cookie', reviewerCookie)
      .send({ rubricCriteriaId: rubricCriteria.id })
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
      .send({ rubricCriteriaId: rubricCriteria.id })
      .expect(401);
  });
});
