// @ts-nocheck
import { Proposal, ProposalCategory } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { disconnectProposalChildren } from 'lib/proposal/disconnectProposalChildren';
import { getRandomThemeColor } from 'theme/utils/getRandomThemeColor';
import { v4 } from 'uuid';
async function migrateReviewers() {
  const feedbackSteps = await prisma.proposalEvaluation.findMany({
    where: {
      type: 'feedback'
    },
    include: {
      reviewers: true,
      permissions: true
    }
  });
  console.log('found', feedbackSteps.length, 'feedback steps');
  for (const step of feedbackSteps) {
    const withMoveAccess = step.permissions.filter((p) => p.type === 'move');
    if (withMoveAccess.length === 0) {
      console.error('Feedback step does not have move permission for anyone?!', step);
    } else {
      for (const entity of withMoveAccess) {
        await prisma.prisma.proposalReviewer.create({
          ...entity,
          id: v4(),
          evaluationId: step.evaluationId,
          proposalId: step.proposalId
        });
      }
    }
    if (feedbackSteps.indexOf(step) % 100 === 0) {
      console.log('migrated', feedbackSteps.indexOf(step), 'feedback steps');
    }
  }
}
// migrateProposals()
