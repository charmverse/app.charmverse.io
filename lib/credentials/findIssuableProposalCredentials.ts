import { log } from '@charmverse/core/log';
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

import { getFeatureTitle } from 'lib/features/getFeatureTitle';
import { getPagePermalink } from 'lib/pages/getPagePermalink';

import { credentialEventLabels } from './constants';
import type { CredentialDataInput } from './schemas';

export type ProposalWithJoinedData = {
  id: string;
  status: ProposalStatus;
  evaluations: Pick<ProposalEvaluation, 'id' | 'index' | 'result'>[];
  selectedCredentialTemplates: string[];
  authors: {
    author: { id: string; primaryWallet: { address: string } | null; wallets: { address: string }[] };
  }[];
  issuedCredentials: Pick<IssuedCredential, 'userId' | 'credentialTemplateId' | 'credentialEvent'>[];
  page: { id: string };
};

export type IssuableProposalCredentialContent = {
  recipientAddress: string;
  recipientUserId: string;
  credential: CredentialDataInput<'proposal'>;
  credentialTemplateId: string;
  proposalId: string;
  event: CredentialEventType;
};

type GenerateCredentialsParams = {
  proposal: ProposalWithJoinedData;
  space: Pick<Space, 'id' | 'features'> & {
    credentialTemplates: Pick<
      CredentialTemplate,
      'credentialEvents' | 'id' | 'name' | 'description' | 'organization' | 'schemaAddress'
    >[];
  };
};

const events: CredentialEventType[] = ['proposal_created', 'proposal_approved'];

export function generateCredentialInputsForProposal({
  proposal,
  space
}: GenerateCredentialsParams): IssuableProposalCredentialContent[] {
  if (proposal.status === 'draft' || !proposal.selectedCredentialTemplates.length) {
    return [];
  }

  const templateMap = new Map(space.credentialTemplates.map((t) => [t.id, t]));

  const credentialsToIssue: IssuableProposalCredentialContent[] = [];

  const currentEvaluation = getCurrentEvaluation(proposal.evaluations);

  const isApprovedProposal =
    currentEvaluation?.result === 'pass' &&
    currentEvaluation.index === Math.max(...proposal.evaluations.map((e) => e.index));

  const issuableEvents: CredentialEventType[] = isApprovedProposal ? [...events] : ['proposal_created'];

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

export async function findSpaceIssuableProposalCredentials({
  spaceId
}: {
  spaceId: string;
}): Promise<IssuableProposalCredentialContent[]> {
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

  return proposals
    .map((p) => generateCredentialInputsForProposal({ proposal: p as ProposalWithJoinedData, space }))
    .flat();
}
