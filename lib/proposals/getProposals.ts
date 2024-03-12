import type { ProposalPermissionFlags } from '@charmverse/core/permissions';
import type {
  Proposal,
  ProposalAuthor,
  ProposalReviewer,
  ProposalEvaluation,
  ProposalEvaluationResult,
  ProposalEvaluationType
} from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentEvaluation } from '@charmverse/core/proposals';
import { sortBy } from 'lodash';

import { getCurrentStep } from './getCurrentStep';
import type { ProposalStep } from './getCurrentStep';
import type { ProposalFields } from './interfaces';

export type ProposalWithUsersLite = Pick<Proposal, 'createdBy' | 'id'> & {
  archived?: boolean;
  authors: ProposalAuthor[];
  fields: ProposalFields | null;
  formId?: string;
  reviewers: ProposalReviewer[];
  rewardIds: string[];
  currentEvaluationId?: string;
  permissions?: ProposalPermissionFlags;
  evaluations: {
    title: string;
    type: ProposalEvaluationType;
    id: string;
    result: ProposalEvaluationResult | null;
    index: number;
  }[];
  currentStep: ProposalStep;
  templateId?: string | null;
  createdAt: string;
  updatedAt: string;
  updatedBy: string;
  // pageId: string;
  title: string;
};

export async function getProposals({ ids }: { ids: string[] }): Promise<ProposalWithUsersLite[]> {
  const proposals = await prisma.proposal.findMany({
    where: {
      id: {
        in: ids
      },
      page: {
        // Ignore proposal templates
        type: 'proposal',
        deletedAt: null
      }
    },
    include: {
      authors: true,
      rewards: true,
      page: {
        select: {
          title: true,
          createdAt: true,
          updatedAt: true,
          updatedBy: true
        }
      },
      evaluations: {
        orderBy: {
          index: 'asc'
        },
        include: {
          reviewers: true
        }
      },
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

  return proposals.map((proposal) => {
    return mapDbProposalToProposalLite({ proposal });
  });
}

// used for mapping data for proposal blocks/tables which dont need all the evaluation data
function mapDbProposalToProposalLite({
  proposal,
  permissions
}: {
  proposal: Proposal & {
    authors: ProposalAuthor[];
    evaluations: (ProposalEvaluation & { reviewers: ProposalReviewer[] })[];
    rewards: { id: string }[];
    page: { title: string; updatedAt: Date; createdAt: Date; updatedBy: string } | null;
  };
  permissions?: ProposalPermissionFlags;
}): ProposalWithUsersLite {
  const { rewards, ...rest } = proposal;
  const currentEvaluation = getCurrentEvaluation(proposal.evaluations);
  const fields = (rest.fields as ProposalFields) ?? null;

  const proposalWithUsers: ProposalWithUsersLite = {
    id: rest.id,
    createdAt: (proposal.page?.createdAt || new Date()).toISOString(),
    createdBy: rest.createdBy,
    authors: proposal.authors,
    archived: proposal.archived || undefined,
    formId: rest.formId || undefined,
    // spaceId: rest.spaceId,
    evaluations: sortBy(proposal.evaluations, 'index').map((e) => ({
      title: e.title,
      index: e.index,
      type: e.type,
      result: e.result,
      id: e.id
    })),
    permissions,
    currentStep: getCurrentStep({
      evaluations: proposal.evaluations,
      hasPendingRewards: (fields?.pendingRewards ?? []).length > 0,
      proposalStatus: proposal.status,
      hasPublishedRewards: rewards.length > 0
    }),
    currentEvaluationId: proposal.status !== 'draft' && proposal.evaluations.length ? currentEvaluation?.id : undefined,
    // status: proposal.status,
    title: proposal.page?.title || '',
    updatedAt: (proposal.page?.updatedAt || new Date()).toISOString(),
    updatedBy: proposal.page?.updatedBy || '',
    reviewers: (proposal.status !== 'draft' && currentEvaluation?.reviewers) || [],
    rewardIds: rewards.map((r) => r.id),
    fields
  };

  return proposalWithUsers;
}
