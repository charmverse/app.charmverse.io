import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsProposals } from '@charmverse/core/test';

import { mockPermissions } from 'testing/mocks/proposal';
import { generateUserAndSpace } from 'testing/setupDatabase';
import { generateProposalWorkflow } from 'testing/utils/proposals';

import { mapDbProposalToProposal } from '../mapDbProposalToProposal';
import type { ProposalToMap } from '../mapDbProposalToProposal';

describe('mapDbProposalToProposal', () => {
  it('Includes rubric reviews when share reviews is enabled', async () => {
    const { user, space } = await generateUserAndSpace();
    const workflow = await generateProposalWorkflow({ spaceId: space.id });

    const { id } = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: user.id,
      workflowId: workflow.id,
      evaluationInputs: [
        {
          reviewers: [{ group: 'user', id: user.id }],
          rubricCriteria: [{ title: 'a question' }],
          evaluationType: 'rubric',
          title: 'Rubric',
          permissions: []
        }
      ]
    });

    // TODO: geenrator should allow passing in shareReviews
    await prisma.proposalEvaluation.updateMany({
      where: {
        proposalId: id
      },
      data: {
        shareReviews: true
      }
    });

    const rubricCriteria = await prisma.proposalRubricCriteria.findFirstOrThrow({
      where: {
        proposalId: id
      }
    });

    // create an answer
    await prisma.proposalRubricCriteriaAnswer.create({
      data: {
        proposalId: id,
        rubricCriteriaId: rubricCriteria.id,
        evaluationId: rubricCriteria.evaluationId,
        response: { score: 7 },
        comment: 'comment',
        userId: user.id
      }
    });

    const proposal = await prisma.proposal.findUniqueOrThrow({
      where: {
        id
      },
      include: {
        evaluations: {
          include: {
            permissions: true,
            reviewers: true,
            appealReviewers: true,
            rubricCriteria: {
              orderBy: {
                index: 'asc'
              }
            },
            rubricAnswers: true,
            draftRubricAnswers: true,
            reviews: true,
            vote: true,
            appealReviews: true
          }
        },
        authors: true,
        page: { select: { id: true, content: true, contentText: true, sourceTemplateId: true, type: true } },
        rewards: true,
        form: {
          include: {
            formFields: {
              orderBy: {
                index: 'asc'
              }
            }
          }
        }
      }
    });

    const mapped = mapDbProposalToProposal({
      proposal: proposal as any as ProposalToMap,
      workflow: null,
      permissions: mockPermissions
    });

    // New form should be created since we are duplicating a proposal template
    expect(mapped.evaluations[0].rubricAnswers.length).toEqual(1);
  });
});
