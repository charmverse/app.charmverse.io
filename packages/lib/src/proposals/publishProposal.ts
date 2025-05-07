import type { Prisma } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentStep } from '@packages/lib/proposals/getCurrentStep';
import type { ProposalFields } from '@packages/lib/proposals/interfaces';
import { relay } from 'lib/websockets/relay';

import { createVoteIfNecessary } from './createVoteIfNecessary';
import { getVoteEvaluationStepsWithBlockNumber } from './getVoteEvaluationStepsWithBlockNumber';
import { setPageUpdatedAt } from './setPageUpdatedAt';

export async function publishProposal({ proposalId, userId }: { proposalId: string; userId: string }) {
  const result = await prisma.proposal.update({
    where: {
      id: proposalId
    },
    data: {
      status: 'published',
      publishedAt: new Date()
    },
    include: {
      page: {
        select: {
          type: true
        }
      },
      issuedCredentials: {
        select: {
          credentialTemplateId: true,
          onchainAttestationId: true,
          ceramicId: true
        }
      },
      space: {
        select: {
          useOnchainCredentials: true,
          credentialTemplates: {
            select: {
              id: true
            },
            where: {
              schemaType: 'proposal'
            }
          }
        }
      },
      evaluations: true
    }
  });

  await setPageUpdatedAt({ proposalId, userId });

  const updatedEvaluations = await getVoteEvaluationStepsWithBlockNumber({
    evaluations: result.evaluations,
    isDraft: false,
    pageType: result.page?.type
  });

  await Promise.all(
    updatedEvaluations.map((evaluation) =>
      prisma.proposalEvaluation.update({
        where: {
          id: evaluation.id
        },
        data: {
          voteSettings: evaluation.voteSettings as Prisma.InputJsonValue
        }
      })
    )
  );

  await createVoteIfNecessary({
    createdBy: userId,
    proposalId
  });

  const applicableSelectedCredentials = result.selectedCredentialTemplates.filter((template) =>
    result.space.credentialTemplates.some((spaceTemplate) => spaceTemplate.id === template)
  );

  relay.broadcast(
    {
      type: 'proposals_updated',
      payload: [
        {
          id: proposalId,
          currentStep: getCurrentStep({
            evaluations: result.evaluations,
            hasPendingRewards: ((result.fields as ProposalFields)?.pendingRewards ?? []).length > 0,
            proposalStatus: result.status,
            hasPublishedRewards: false,
            credentialsEnabled: result.space.credentialTemplates.some((template) =>
              result.selectedCredentialTemplates.includes(template.id)
            ),
            hasPendingCredentials: applicableSelectedCredentials.every((cred) =>
              result.issuedCredentials.some((issuedCred) =>
                issuedCred.credentialTemplateId === cred && result.space.useOnchainCredentials
                  ? issuedCred.onchainAttestationId
                  : !!issuedCred.ceramicId
              )
            )
          })
        }
      ]
    },
    result.spaceId
  );
}
