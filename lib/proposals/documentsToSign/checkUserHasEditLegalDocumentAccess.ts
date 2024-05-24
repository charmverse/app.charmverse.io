import { InvalidInputError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';

import type { MaybeString } from 'charmClient/hooks/helpers';
import { permissionsApiClient } from 'lib/permissions/api/client';

/**
 * Ensure a user has permission to edit legal documents for a proposal in at least 1 sign_documents evaluation
 */
export async function checkUserHasEditLegalDocumentAccess({
  proposalId,
  evaluationId,
  userId
}: {
  userId: MaybeString;
  proposalId?: string;
  evaluationId?: string;
}): Promise<boolean> {
  if (!userId) {
    return false;
  }

  if (!proposalId && !evaluationId) {
    throw new InvalidInputError('proposalId or evaluationId is required');
  }

  if (evaluationId) {
    const evaluation = await prisma.proposalEvaluation.findUniqueOrThrow({
      where: {
        id: evaluationId
      },
      select: {
        proposalId: true
      }
    });

    proposalId = evaluation.proposalId;
  }

  const proposal = await prisma.proposal.findUniqueOrThrow({
    where: {
      id: proposalId
    },
    select: {
      evaluations: {
        where: {
          type: 'sign_documents'
        },
        select: {
          id: true
        }
      }
    }
  });

  const allPermissions = await permissionsApiClient.proposals.computeAllProposalEvaluationPermissions({
    resourceId: proposalId as string,
    userId
  });

  for (const documentStep of proposal.evaluations) {
    if (allPermissions[documentStep.id].evaluate) {
      return true;
    }
  }

  return false;
}
