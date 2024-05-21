import type { Prisma } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import type { WorkflowEvaluationJson } from '@charmverse/core/proposals';

import { permissionsApiClient } from 'lib/permissions/api/client';
import { getCurrentStep } from 'lib/proposals/getCurrentStep';
import type { PopulatedEvaluation, ProposalFields } from 'lib/proposals/interfaces';
import { prettyPrint } from 'lib/utils/strings';
import { relay } from 'lib/websockets/relay';

import { createVoteIfNecessary } from './createVoteIfNecessary';
import { getVoteEvaluationStepsWithBlockNumber } from './getVoteEvaluationStepsWithBlockNumber';
import type { DetailedProposalEvaluation } from './mapDbProposalToProposal';
import { setPageUpdatedAt } from './setPageUpdatedAt';

export async function publishProposal({ proposalId, userId }: { proposalId: string; userId: string }) {
  const result = await prisma.proposal.update({
    where: {
      id: proposalId
    },
    data: {
      status: 'published'
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
      evaluations: {
        orderBy: {
          index: 'asc'
        },
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
          vote: true
        }
      }
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

  const permissionsByStep = await permissionsApiClient.proposals.computeAllProposalEvaluationPermissions({
    resourceId: proposalId,
    userId
  });

  const workflow = result.workflowId
    ? await prisma.proposalWorkflow.findFirst({
        where: {
          id: result.workflowId
        },
        select: {
          evaluations: true
        }
      })
    : null;

  relay.broadcast(
    {
      type: 'proposals_updated',
      payload: [
        {
          id: proposalId,
          evaluations: (result.evaluations as DetailedProposalEvaluation[]).map((evaluation) => {
            const workflowEvaluation = (workflow?.evaluations as WorkflowEvaluationJson[]).find(
              (e) => e.title === evaluation.title && e.type === evaluation.type
            );
            const stepPermissions = permissionsByStep?.[evaluation.id];
            return {
              ...evaluation,
              appealReviewers: evaluation.appealReviewers || [],
              declineReasonOptions: workflowEvaluation?.declineReasons ?? [],
              isReviewer: !!stepPermissions?.evaluate,
              isAppealReviewer: !!stepPermissions?.evaluate_appeal
            };
          }) as PopulatedEvaluation[],
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
