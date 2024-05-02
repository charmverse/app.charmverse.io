import type { ProposalPermissionFlags } from '@charmverse/core/permissions';
import type {
  IssuedCredential,
  Proposal,
  ProposalAuthor,
  ProposalEvaluation,
  ProposalEvaluationResult,
  ProposalEvaluationType,
  ProposalReviewer
} from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentEvaluation } from '@charmverse/core/proposals';
import { arrayUtils } from '@charmverse/core/utilities';
import { sortBy } from 'lodash';

import type {
  IssuableProposalCredentialAuthor,
  IssuableProposalCredentialSpace,
  ProposalWithJoinedData
} from 'lib/credentials/findIssuableProposalCredentials';
import { generateCredentialInputsForProposal } from 'lib/credentials/findIssuableProposalCredentials';

import type { ProposalStep } from './getCurrentStep';
import { getCurrentStep } from './getCurrentStep';
import type { ProposalFields } from './interfaces';

export type ProposalWithUsersLite = Pick<Proposal, 'createdBy' | 'id' | 'selectedCredentialTemplates'> & {
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
  pageId: string;
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
      authors: {
        include: {
          author: {
            select: {
              id: true,
              primaryWallet: true,
              wallets: true
            }
          }
        }
      },
      rewards: true,
      page: {
        select: {
          id: true,
          title: true,
          createdAt: true,
          updatedAt: true,
          updatedBy: true
        }
      },
      issuedCredentials: {
        select: {
          userId: true,
          credentialTemplateId: true,
          credentialEvent: true,
          onchainAttestationId: true
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

  const spaces = await prisma.space.findMany({
    where: {
      id: {
        in: arrayUtils.uniqueValues(proposals.map((p) => p.spaceId))
      }
    },
    include: {
      credentialTemplates: {
        where: {
          schemaType: 'proposal'
        }
      }
    }
  });

  return proposals.map((proposal) => {
    return mapDbProposalToProposalLite({
      proposal,
      space: spaces.find((s) => s.id === proposal.spaceId) as IssuableProposalCredentialSpace
    });
  });
}

// used for mapping data for proposal blocks/tables which dont need all the evaluation data
function mapDbProposalToProposalLite({
  proposal,
  permissions,
  space
}: {
  proposal: Proposal & {
    authors: (ProposalAuthor & IssuableProposalCredentialAuthor)[];
    evaluations: (ProposalEvaluation & { reviewers: ProposalReviewer[] })[];
    rewards: { id: string }[];
    page: { id: string; title: string; updatedAt: Date; createdAt: Date; updatedBy: string } | null;
    issuedCredentials: Pick<
      IssuedCredential,
      'userId' | 'credentialTemplateId' | 'credentialEvent' | 'onchainAttestationId'
    >[];
  };
  space: IssuableProposalCredentialSpace & { useOnchainCredentials?: boolean | null };
  permissions?: ProposalPermissionFlags;
}): ProposalWithUsersLite {
  const { rewards, ...rest } = proposal;
  const currentEvaluation = getCurrentEvaluation(proposal.evaluations);
  const pendingCredentials = generateCredentialInputsForProposal({
    proposal: proposal as ProposalWithJoinedData,
    space
  });
  const fields = (rest.fields as ProposalFields) ?? null;

  const validSelectedCredentials = proposal.selectedCredentialTemplates.filter((templateId) =>
    space.credentialTemplates.some((t) => t.id === templateId)
  );

  const proposalWithUsers: ProposalWithUsersLite = {
    id: rest.id,
    createdAt: (proposal.page?.createdAt || new Date()).toISOString(),
    createdBy: rest.createdBy,
    authors: proposal.authors,
    selectedCredentialTemplates: validSelectedCredentials,
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
      hasPublishedRewards: rewards.length > 0,
      credentialsEnabled: !!validSelectedCredentials.length,
      hasPendingCredentials:
        !!pendingCredentials.length ||
        (!space.useOnchainCredentials &&
          validSelectedCredentials.some(
            (cred) => !proposal.issuedCredentials.some((issuedCred) => issuedCred.credentialTemplateId === cred)
          ))
    }),
    currentEvaluationId: proposal.status !== 'draft' && proposal.evaluations.length ? currentEvaluation?.id : undefined,
    // status: proposal.status,
    title: proposal.page?.title || '',
    updatedAt: (proposal.page?.updatedAt || new Date()).toISOString(),
    updatedBy: proposal.page?.updatedBy || '',
    pageId: proposal.page?.id || '',
    reviewers: (proposal.status !== 'draft' && currentEvaluation?.reviewers) || [],
    rewardIds: rewards.map((r) => r.id),
    fields
  };

  return proposalWithUsers;
}
