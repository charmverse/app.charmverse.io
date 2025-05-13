import type {
  CredentialEventType,
  CredentialTemplate,
  IssuedCredential,
  ProposalEvaluation,
  ProposalStatus,
  Space
} from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentEvaluation } from '@charmverse/core/proposals';
import { getFeatureTitle } from '@packages/features/getFeatureTitle';
import { getPagePermalink } from '@packages/pages/getPagePermalink';
import { lowerCaseEqual } from '@packages/utils/strings';

import { credentialEventLabels } from './constants';
import type { TypedPendingGnosisSafeTransaction } from './indexGnosisSafeCredentialTransaction';
import type { CredentialDataInput } from './schemas/interfaces';

export type IssuableProposalCredentialAuthor = {
  author: { id: string; primaryWallet: { address: string } | null; wallets: { address: string }[] };
};

export type IssuableProposalCredentialSpace = Pick<Space, 'id' | 'features' | 'useOnchainCredentials'> & {
  credentialTemplates: Pick<
    CredentialTemplate,
    'credentialEvents' | 'id' | 'name' | 'description' | 'organization' | 'schemaAddress'
  >[];
};

export type ProposalWithJoinedData = {
  id: string;
  status: ProposalStatus;
  evaluations: (Pick<ProposalEvaluation, 'id' | 'index' | 'result'> & {
    finalStep?: boolean | null;
    appealedAt?: Date | null;
  })[];
  selectedCredentialTemplates: string[];
  authors: IssuableProposalCredentialAuthor[];
  issuedCredentials: Pick<
    IssuedCredential,
    'userId' | 'credentialTemplateId' | 'credentialEvent' | 'onchainAttestationId'
  >[];
  page: { id: string };
};

export type IssuableProposalCredentialContent = {
  recipientAddress: string;
  recipientUserId: string;
  credential: CredentialDataInput<'proposal'>;
  credentialTemplateId: string;
  proposalId: string;
  pageId: string;
  event: Extract<CredentialEventType, 'proposal_approved'>;
};

// A partial subtype to reduce data passed around the system
export type PartialIssuableProposalCredentialContent = Pick<
  IssuableProposalCredentialContent,
  'proposalId' | 'credentialTemplateId' | 'recipientAddress' | 'recipientUserId' | 'event'
>;

/**
 * @existingPendingTransactionEvents - Events with already pending credentials awaiting a Gnosis safe transaction
 */
type GenerateCredentialsParams = {
  proposal: ProposalWithJoinedData;
  space: IssuableProposalCredentialSpace;
  pendingIssuableCredentials?: PartialIssuableProposalCredentialContent[];
};

const events: CredentialEventType[] = ['proposal_approved'];

export function generateCredentialInputsForProposal({
  proposal,
  space,
  pendingIssuableCredentials
}: GenerateCredentialsParams): IssuableProposalCredentialContent[] {
  if (proposal.status === 'draft' || !proposal.selectedCredentialTemplates.length || !space.useOnchainCredentials) {
    return [];
  }

  const currentStep = getCurrentEvaluation(proposal.evaluations);

  // We only support proposal_approved, so proposal needs to have reached final evaluation
  if (currentStep?.result !== 'pass') {
    return [];
  }

  const templateMap = new Map(space.credentialTemplates.map((t) => [t.id, t]));

  const credentialsToIssue: IssuableProposalCredentialContent[] = [];

  const currentEvaluation = getCurrentEvaluation(proposal.evaluations);

  const isApprovedProposal =
    currentEvaluation?.result === 'pass' &&
    currentEvaluation.index === Math.max(...proposal.evaluations.map((e) => e.index));

  const issuableEvents: CredentialEventType[] = ['proposal_approved'];

  proposal.authors.forEach(({ author }) => {
    const targetWallet = author.primaryWallet?.address ?? author.wallets[0]?.address;
    if (!targetWallet) {
      return;
    }

    proposal.selectedCredentialTemplates.forEach((credentialTemplateId) => {
      for (const event of issuableEvents) {
        if (
          !pendingIssuableCredentials?.some(
            (pendingIssuableCred) =>
              pendingIssuableCred.credentialTemplateId === credentialTemplateId &&
              pendingIssuableCred.event === event &&
              lowerCaseEqual(pendingIssuableCred.recipientAddress, targetWallet)
          )
        ) {
          const credentialTemplate = templateMap.get(credentialTemplateId);

          const canIssueCredential =
            !!credentialTemplate &&
            credentialTemplate.credentialEvents.includes(event) &&
            !proposal.issuedCredentials.some(
              (ic) =>
                ic.userId === author.id &&
                ic.credentialTemplateId === credentialTemplateId &&
                ic.credentialEvent === event &&
                !!ic.onchainAttestationId
            );

          if (canIssueCredential) {
            const getEventLabel = credentialEventLabels[event];
            const eventLabel = getEventLabel
              ? getEventLabel((value) => getFeatureTitle(value, space.features as any))
              : '';

            credentialsToIssue.push({
              recipientAddress: targetWallet,
              proposalId: proposal.id,
              recipientUserId: author.id,
              pageId: proposal.page.id,
              event: event as Extract<CredentialEventType, 'proposal_approved'>,
              credential: {
                Name: credentialTemplate.name,
                Description: credentialTemplate.description ?? '',
                Organization: credentialTemplate.organization,
                Event: eventLabel,
                URL: getPagePermalink({ pageId: proposal.page.id })
              },
              credentialTemplateId: credentialTemplate.id
            });
          }
        }
      }
    });
  });

  return credentialsToIssue;
}

function proposalCredentialInputFieldsSelect() {
  return {
    id: true,
    status: true,
    evaluations: {
      select: {
        id: true,
        result: true,
        index: true,
        type: true,
        title: true,
        finalStep: true,
        appealedAt: true
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
    selectedCredentialTemplates: true,
    page: {
      select: {
        id: true
      }
    },
    authors: {
      select: {
        author: {
          select: {
            id: true,
            primaryWallet: true,
            wallets: true
          }
        }
      }
    }
  };
}

export type FindIssuableProposalCredentialsInput = {
  spaceId: string;
  proposalIds?: string[];
};

export async function findSpaceIssuableProposalCredentials({
  spaceId,
  proposalIds
}: FindIssuableProposalCredentialsInput): Promise<IssuableProposalCredentialContent[]> {
  const space = await prisma.space.findUniqueOrThrow({
    where: {
      id: spaceId
    },
    select: {
      id: true,
      features: true,
      useOnchainCredentials: true,
      credentialTemplates: {
        where: {
          credentialEvents: {
            hasSome: events
          }
        }
      }
    }
  });

  const proposalIdsList = !proposalIds ? undefined : typeof proposalIds === 'string' ? [proposalIds] : proposalIds;

  const proposals = await prisma.proposal.findMany({
    where: {
      OR: proposalIdsList
        ? [
            {
              id: {
                in: proposalIdsList
              }
            },
            {
              page: {
                id: {
                  in: proposalIdsList
                }
              }
            }
          ]
        : undefined,
      spaceId,
      page: {
        type: 'proposal'
      }
    },
    select: proposalCredentialInputFieldsSelect()
  });

  const pendingSafeTransactions = await prisma.pendingSafeTransaction.findMany({
    where: {
      spaceId,
      proposalIds: {
        hasSome: proposals.map((p) => p.id)
      }
    },
    select: {
      credentialContent: true,
      proposalIds: true
    }
  });

  const pendingProposalsInSafe = pendingSafeTransactions.reduce(
    (acc, pendingTx) => {
      for (const proposalId of pendingTx.proposalIds) {
        const pendingProposalCredentials =
          (pendingTx as TypedPendingGnosisSafeTransaction<'proposal'>).credentialContent?.[proposalId] ?? [];

        if (!acc[proposalId]) {
          acc[proposalId] = [];
        }

        acc[proposalId].push(...pendingProposalCredentials);
      }

      return acc;
    },
    {} as Record<string, PartialIssuableProposalCredentialContent[]>
  );

  return proposals
    .map((p) =>
      generateCredentialInputsForProposal({
        proposal: p as ProposalWithJoinedData,
        space,
        pendingIssuableCredentials: pendingProposalsInSafe[p.id]
      })
    )
    .flat();
}
