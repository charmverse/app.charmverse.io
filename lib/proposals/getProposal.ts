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
  const { workflow, ...proposal } = await prisma.proposal.findUniqueOrThrow({
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
      },
      workflow: {
        select: {
          evaluations: true
        }
      }
    }
  });

  const credentials = await getProposalOrApplicationCredentials({ proposalId: id }).catch((error) => {
    log.error('Error fetching proposal credentials', { error, proposalId: id });
    return [];
  });

  return mapDbProposalToProposal({
    workflow: workflow
      ? {
          evaluations: workflow.evaluations as any as WorkflowEvaluationJson[]
        }
      : null,
    proposal: { ...proposal, issuedCredentials: credentials },
    permissionsByStep,
    userId
  });
}
