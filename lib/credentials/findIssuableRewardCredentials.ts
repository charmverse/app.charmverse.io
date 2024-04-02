import { log } from '@charmverse/core/log';
import type {
  CredentialEventType,
  CredentialTemplate,
  IssuedCredential,
  RewardEvaluation,
  RewardStatus,
  Space
} from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentEvaluation } from '@charmverse/core/proposals';
import { arrayUtils } from '@charmverse/core/utilities';

import { getFeatureTitle } from 'lib/features/getFeatureTitle';
import { getPagePermalink } from 'lib/pages/getPagePermalink';
import { lowerCaseEqual } from 'lib/utils/strings';

import { credentialEventLabels } from './constants';
import type { TypedPendingGnosisSafeTransaction } from './indexOnChainRewardCredential';
import type { CredentialDataInput } from './schemas';

export type RewardWithJoinedData = {
  id: string;
  status: RewardStatus;
  evaluations: Pick<RewardEvaluation, 'id' | 'index' | 'result'>[];
  selectedCredentialTemplates: string[];
  authors: {
    author: { id: string; primaryWallet: { address: string } | null; wallets: { address: string }[] };
  }[];
  issuedCredentials: Pick<IssuedCredential, 'userId' | 'credentialTemplateId' | 'credentialEvent'>[];
  page: { id: string };
};

export type IssuableRewardCredentialContent = {
  recipientAddress: string;
  recipientUserId: string;
  credential: CredentialDataInput<'proposal'>;
  credentialTemplateId: string;
  proposalId: string;
  pageId: string;
  event: CredentialEventType;
};

// A partial subtype to reduce data passed around the system
export type PartialIssuableRewardCredentialContent = Pick<
  IssuableRewardCredentialContent,
  'proposalId' | 'event' | 'credentialTemplateId' | 'recipientAddress'
>;

/**
 * @existingPendingTransactionEvents - Events with already pending credentials awaiting a Gnosis safe transaction
 */
type GenerateCredentialsParams = {
  proposal: RewardWithJoinedData;
  space: Pick<Space, 'id' | 'features'> & {
    credentialTemplates: Pick<
      CredentialTemplate,
      'credentialEvents' | 'id' | 'name' | 'description' | 'organization' | 'schemaAddress'
    >[];
  };
  pendingIssuableCredentials?: PartialIssuableRewardCredentialContent[];
};

const events: CredentialEventType[] = ['proposal_created', 'proposal_approved'];

export function generateCredentialInputsForReward({
  proposal,
  space,
  pendingIssuableCredentials
}: GenerateCredentialsParams): IssuableRewardCredentialContent[] {
  if (proposal.status === 'draft' || !proposal.selectedCredentialTemplates.length) {
    return [];
  }

  const templateMap = new Map(space.credentialTemplates.map((t) => [t.id, t]));

  const credentialsToIssue: IssuableRewardCredentialContent[] = [];

  const currentEvaluation = getCurrentEvaluation(proposal.evaluations);

  const isApprovedReward =
    currentEvaluation?.result === 'pass' &&
    currentEvaluation.index === Math.max(...proposal.evaluations.map((e) => e.index));

  const issuableEvents: CredentialEventType[] = isApprovedReward ? [...events] : ['proposal_created'];

  proposal.authors.forEach(({ author }) => {
    const targetWallet = author.primaryWallet?.address ?? author.wallets[0]?.address;
    if (!targetWallet) {
      log.warn(`User has no wallet to issue credentials to`, {
        pageId: proposal.page.id,
        userId: author.id,
        proposalId: proposal.id,
        credentialsToIssue
      });
      return;
    }

    proposal.selectedCredentialTemplates.forEach((credentialTemplateId) => {
      for (const event of issuableEvents) {
        if (
          !pendingIssuableCredentials?.some(
            (pic) =>
              pic.credentialTemplateId === credentialTemplateId &&
              pic.event === event &&
              lowerCaseEqual(pic.recipientAddress, targetWallet)
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
                ic.credentialEvent === event
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
              event,
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

export function proposalCredentialInputFieldsSelect() {
  return {
    id: true,
    status: true,
    evaluations: {
      select: {
        id: true,
        result: true,
        index: true
      }
    },
    issuedCredentials: {
      select: {
        userId: true,
        credentialTemplateId: true,
        credentialEvent: true
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

export async function findSpaceIssuableRewardCredentials({
  spaceId
}: {
  spaceId: string;
}): Promise<IssuableRewardCredentialContent[]> {
  const space = await prisma.space.findUniqueOrThrow({
    where: {
      id: spaceId
    },
    select: {
      id: true,
      features: true,
      credentialTemplates: {
        where: {
          credentialEvents: {
            hasSome: events
          }
        }
      }
    }
  });

  const proposals = await prisma.proposal.findMany({
    where: {
      spaceId,
      page: {}
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

  const pendingRewardsInSafe = pendingSafeTransactions.reduce((acc, pendingTx) => {
    for (const proposalId of pendingTx.proposalIds) {
      const pendingRewardCredentials =
        (pendingTx as TypedPendingGnosisSafeTransaction).credentialContent?.[proposalId] ?? [];

      if (!acc[proposalId]) {
        acc[proposalId] = [];
      }

      acc[proposalId].push(...pendingRewardCredentials);
    }

    return acc;
  }, {} as Record<string, PartialIssuableRewardCredentialContent[]>);

  return proposals
    .map((p) =>
      generateCredentialInputsForReward({
        proposal: p as RewardWithJoinedData,
        space,
        pendingIssuableCredentials: pendingRewardsInSafe[p.id]
      })
    )
    .flat();
}
