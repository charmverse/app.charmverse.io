import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import type { WorkflowEvaluationJson } from '@charmverse/core/proposals';
import { getCurrentEvaluation } from '@charmverse/core/proposals';
import { getProposalOrApplicationCredentials } from '@root/lib/credentials/getProposalOrApplicationCredentials';
import type { permissionsApiClient } from '@root/lib/permissions/api/client';
import { projectInclude } from '@root/lib/projects/constants';

import type { ProposalWithUsersAndRubric } from './interfaces';
import { mapDbProposalToProposal } from './mapDbProposalToProposal';

type PermissionsMap = Awaited<
  ReturnType<typeof permissionsApiClient.proposals.computeAllProposalEvaluationPermissions>
>;

export async function getProposal({
  id,
  permissionsByStep,
  userId
}: {
  id: string;
  permissionsByStep: PermissionsMap;
  userId?: string;
}): Promise<ProposalWithUsersAndRubric> {
  const proposal = await prisma.proposal.findUniqueOrThrow({
    where: {
      id
    },
    include: {
      evaluations: {
        orderBy: {
          index: 'asc'
        },
        include: {
          permissions: true,
          reviewers: true,
          appealReviewers: true,
          appealReviews: true,
          evaluationApprovers: true,
          rubricCriteria: {
            orderBy: {
              index: 'asc'
            }
          },
          reviews: true,
          rubricAnswers: true,
          draftRubricAnswers: true,
          vote: true
        }
      },
      authors: true,
      page: {
        select: { permissions: true, id: true, content: true, contentText: true, sourceTemplateId: true, type: true }
      },
      rewards: true,
      project: {
        include: projectInclude
      },
      form: {
        include: {
          formFields: {
            orderBy: {
              index: 'asc'
            }
          }
        }
      },
      space: {
        select: {
          paidTier: true,
          publicProposals: true
        }
      }
    }
  });

  const currentEvaluation = getCurrentEvaluation(proposal.evaluations);

  const currentPermissions =
    proposal.status === 'draft'
      ? permissionsByStep.draft
      : currentEvaluation && permissionsByStep[currentEvaluation.id];

  if (!currentPermissions) {
    throw new Error('Could not find permissions for proposal');
  }

  const proposalEvaluationReviews = proposal.evaluations.map((e) => e.reviews).flat();
  const proposalEvaluationAppealReviews = proposal.evaluations.map((e) => e.appealReviews).flat();

  const [workflow, credentials] = await Promise.all([
    proposal.workflowId
      ? await prisma.proposalWorkflow.findFirst({
          where: {
            id: proposal.workflowId
          },
          select: {
            evaluations: true
          }
        })
      : Promise.resolve(null),
    getProposalOrApplicationCredentials({ proposalId: id }).catch((error) => {
      log.error('Error fetching proposal credentials', { error, proposalId: id });
      return [];
    })
  ]);

  const isPublicPage =
    proposal.status === 'published' && currentEvaluation?.permissions.some((p) => p.systemRole === 'public');

  return mapDbProposalToProposal({
    proposalEvaluationReviews,
    proposalEvaluationAppealReviews,
    workflow: workflow
      ? {
          evaluations: workflow.evaluations as WorkflowEvaluationJson[]
        }
      : null,
    proposal: { ...proposal, issuedCredentials: credentials },
    permissions: currentPermissions,
    isPublicPage,
    permissionsByStep,
    userId
  });
}
