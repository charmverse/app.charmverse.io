import { InvalidInputError, UnauthorisedActionError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';
import { canAccessDocusign } from '@packages/lib/docusign/canAccessDocusign';
import { permissionsApiClient } from '@packages/lib/permissions/api/client';

export async function checkHasProposalLegalDocsAccess({
  userId,
  evaluationId,
  proposalId
}: {
  userId: string;
  evaluationId?: string;
  proposalId?: string;
}): Promise<void> {
  if (!userId) {
    throw new UnauthorisedActionError('You must be logged in to perform this action');
  }

  if (!evaluationId && !proposalId) {
    throw new InvalidInputError('You must provide either an evaluationId or a proposalId');
  }

  if (!proposalId) {
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
      },
      spaceId: true
    }
  });

  const hasDocusignAccess = await canAccessDocusign({
    spaceId: proposal.spaceId,
    userId
  });

  if (!hasDocusignAccess) {
    throw new UnauthorisedActionError('You do not have access to Docusign for this space');
  }

  const allPermissions = await permissionsApiClient.proposals.computeAllProposalEvaluationPermissions({
    resourceId: proposalId as string,
    userId
  });

  for (const documentStep of proposal.evaluations) {
    if (allPermissions[documentStep.id].evaluate) {
      return;
    }
  }

  throw new UnauthorisedActionError('You do not have permission to access legal documents for this proposal');
}
