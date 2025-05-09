// @ts-nocheck
import { Proposal, ProposalCategory } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { disconnectProposalChildren } from '@packages/lib/proposals/disconnectProposalChildren';
import { getRandomThemeColor } from 'theme/utils/getRandomThemeColor';
import { v4 } from 'uuid';

async function migrateReviewers() {
  const feedbackSteps = await prisma.proposalEvaluation.findMany({
    where: {
      type: 'feedback'
    },
    include: {
      reviewers: true,
      permissions: true,
      proposal: {
        include: {
          page: { select: { createdAt: true, spaceId: true, title: true, type: true } }
        }
      }
    }
  });
  let stepsUpdated = 0;
  console.log('found', feedbackSteps.length, 'feedback steps');
  for (const step of feedbackSteps) {
    if (step.reviewers.length > 0) {
      if (step.proposal.page?.title !== 'Getting Started') {
        console.log('Feedback step already has reviewers', step);
      }
    } else {
      const withMoveAccess = step.permissions.filter((p) => p.operation === 'move');
      if (withMoveAccess.length === 0) {
        // add author to feedback step in templates
        await prisma.proposalReviewer.create({
          data: {
            systemRole: 'author',
            id: v4(),
            evaluationId: step.id,
            proposalId: step.proposalId
          }
        });
        stepsUpdated++;
      } else {
        for (const entity of withMoveAccess) {
          await prisma.proposalReviewer.create({
            data: {
              ...entity,
              operation: undefined,
              id: v4(),
              evaluationId: step.id,
              proposalId: step.proposalId
            }
          });
        }
        stepsUpdated++;
      }
    }
    if (feedbackSteps.indexOf(step) % 100 === 0) {
      console.log('migrated', feedbackSteps.indexOf(step), 'feedback steps');
    }
  }
  console.log({ stepsUpdated });
}
migrateReviewers();
