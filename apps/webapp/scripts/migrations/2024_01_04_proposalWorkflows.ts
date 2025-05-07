import { prisma } from '@charmverse/core/prisma-client';
import { getDefaultEvaluation } from '@packages/lib/proposals/workflows/defaultEvaluation';
import { decisionMatrixWorkflowTitle } from '@packages/lib/proposals/workflows/defaultWorkflows';

async function fixProposalWorkflows() {
  await prisma.proposalWorkflow.updateMany({
    where: {
      title: decisionMatrixWorkflowTitle,
      space: {
        domain: {
          not: 'customer'
        }
      }
    },
    data: {
      evaluations: [
        getDefaultEvaluation({
          title: 'Feedback',
          type: 'feedback'
        }),
        getDefaultEvaluation({
          title: 'Rubric evaluation',
          type: 'rubric'
        })
      ]
    }
  });
}
