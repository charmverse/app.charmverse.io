import { DataNotFoundError, InvalidInputError } from '@charmverse/core/errors';
import { log } from '@charmverse/core/log';
import type { CredentialEventType, CredentialTemplate } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentEvaluation } from '@charmverse/core/proposals';
import { optimism } from 'viem/chains';

import { getFeatureTitle } from 'lib/features/getFeatureTitle';
import { getPagePermalink } from 'lib/pages/getPagePermalink';
import { prettyPrint } from 'lib/utils/strings';

import { signAndPublishCharmverseCredential } from './attest';
import { credentialEventLabels } from './constants';

const disablePublishedCredentials = process.env.DISABLE_PUBLISHED_CREDENTIALS === 'true';

export async function issueProposalCredentialsIfNecessary({
  proposalId,
  event
}: {
  proposalId: string;
  event: Extract<CredentialEventType, 'proposal_created' | 'proposal_approved'>;
}): Promise<void> {
  if (disablePublishedCredentials) {
    log.warn('Published credentials are disabled');
    return;
  }

  if (event !== 'proposal_approved' && event !== 'proposal_created') {
    throw new InvalidInputError(`Invalid event type: ${event} for proposal credentials`);
  }

  const baseProposal = await prisma.proposal.findUniqueOrThrow({
    where: {
      id: proposalId
    },
    select: {
      selectedCredentialTemplates: true,
      status: true,
      evaluations: {
        orderBy: {
          index: 'asc'
        }
      }
    }
  });

  if (baseProposal.status === 'draft') {
    return;
  }
  if (!baseProposal.selectedCredentialTemplates?.length) {
    return;
  }
  if (event === 'proposal_approved') {
    const currentEvaluation = getCurrentEvaluation(baseProposal.evaluations);

    if (!currentEvaluation) {
      return;
    } else if (
      currentEvaluation.id !== baseProposal.evaluations[baseProposal.evaluations.length - 1].id ||
      currentEvaluation.result !== 'pass'
    ) {
      return;
    }
  }

  const proposalWithSpaceConfig = await prisma.proposal.findFirstOrThrow({
    where: {
      id: proposalId,
      page: {
        type: 'proposal'
      }
    },
    select: {
      selectedCredentialTemplates: true,
      status: true,
      page: {
        select: {
          id: true
        }
      },
      authors: true,
      space: {
        select: {
          id: true,
          features: true,
          credentialTemplates: {
            where: {
              credentialEvents: {
                has: event
              }
            }
          }
        }
      }
    }
  });

  if (!proposalWithSpaceConfig.page) {
    throw new DataNotFoundError(`Proposal with id ${proposalId} has no matching page`);
  }

  const issuedCredentials = await prisma.issuedCredential.findMany({
    where: {
      credentialEvent: event,
      proposalId,
      userId: {
        in: proposalWithSpaceConfig.authors.map((author) => author.userId)
      }
    }
  });

  // Credential template ids grouped by user id
  const credentialsToIssue: Record<string, string[]> = {};

  for (const author of proposalWithSpaceConfig.authors) {
    proposalWithSpaceConfig.selectedCredentialTemplates.forEach((credentialTemplateId) => {
      const userHasNotReceivedCredential = !issuedCredentials.some(
        (issuedCredential) =>
          issuedCredential.credentialTemplateId === credentialTemplateId && issuedCredential.userId === author.userId
      );
      if (
        userHasNotReceivedCredential &&
        // Only credentials which match the event will have been returned by the query
        proposalWithSpaceConfig.space.credentialTemplates.some((t) => t.id === credentialTemplateId)
      ) {
        if (!credentialsToIssue[author.userId]) {
          credentialsToIssue[author.userId] = [];
        }
        credentialsToIssue[author.userId].push(credentialTemplateId);
      }
    });
  }

  const uniqueAuthors = Object.keys(credentialsToIssue);

  for (const authorUserId of uniqueAuthors) {
    const credentialsToGiveUser = credentialsToIssue[authorUserId].map(
      (cred) => proposalWithSpaceConfig.space.credentialTemplates.find((t) => t.id === cred) as CredentialTemplate
    );

    const author = await prisma.user.findUniqueOrThrow({
      where: {
        id: authorUserId
      },
      select: {
        wallets: true,
        primaryWallet: true
      }
    });

    const targetWallet = author.primaryWallet ?? author.wallets[0];

    if (!targetWallet) {
      log.debug(`User has no wallet to issue credentials to`, {
        pageId: proposalWithSpaceConfig.page.id,
        userId: authorUserId,
        proposalId,
        credentialsToIssue
      });
    } else {
      try {
        for (const credentialTemplate of credentialsToGiveUser) {
          const getEventLabel = credentialEventLabels[event];
          if (!getEventLabel) {
            throw new Error(`No label mapper found for event: ${event}`);
          }
          const eventLabel = getEventLabel((value) =>
            getFeatureTitle(value, proposalWithSpaceConfig.space.features as any[])
          );

          // Iterate through credentials one at a time so we can ensure they're properly created and tracked
          const publishedCredential = await signAndPublishCharmverseCredential({
            chainId: optimism.id,
            recipient: targetWallet.address,
            credential: {
              type: 'proposal',
              data: {
                Name: credentialTemplate.name,
                Description: credentialTemplate.description ?? '',
                Organization: credentialTemplate.organization,
                Event: eventLabel,
                URL: getPagePermalink({ pageId: proposalWithSpaceConfig.page.id })
              }
            },
            credentialTemplateId: credentialTemplate.id,
            event,
            recipientUserId: authorUserId,
            proposalId,
            pageId: proposalWithSpaceConfig.page.id
          });
        }
      } catch (e) {
        log.error('Failed to issue credential', {
          pageId: proposalWithSpaceConfig.page.id,
          proposalId,
          userId: authorUserId,
          credentialsToGiveUser,
          error: e
        });

        prettyPrint(e);
      }
    }
  }
}
