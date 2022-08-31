import { Bounty, Page } from '@prisma/client';
import * as client from './collablandClient';

const DOMAIN = process.env.DOMAIN;

interface CharmVerseBounty extends Bounty {
  page: Page;
}

interface RequestParams {
  bounty: CharmVerseBounty;
  discordUserId: string;
  spaceDomain: string;
}

export function createBountyCreatedCredential ({ bounty, discordUserId, spaceDomain }: RequestParams) {

  return client.createCredential({
    subject: getCredentialSubject({
      bounty,
      spaceDomain,
      id: discordUserId,
      eventName: 'bounty_created',
      eventDate: new Date().toISOString()
    })
  });
}

export function createBountyStartedCredential ({ bounty, discordUserId, spaceDomain }: RequestParams) {

  return client.createCredential({
    subject: getCredentialSubject({
      bounty,
      spaceDomain,
      id: discordUserId,
      eventName: 'bounty_started',
      eventDate: new Date().toISOString()
    })
  });
}

export function createBountyCompletedCredential ({ bounty, discordUserId, spaceDomain }: RequestParams) {

  return client.createCredential({
    subject: getCredentialSubject({ bounty,
      spaceDomain,
      id: discordUserId,
      eventName: 'bounty_completed',
      eventDate: new Date().toISOString()
    })
  });
}

// utils

interface GetCredentialInput {
  bounty: CharmVerseBounty;
  spaceDomain: string;
  id: string;
  eventName: client.BountyEventSubject['eventName'];
  eventDate: string;
}

function getCredentialSubject ({ bounty, spaceDomain, ...info }: GetCredentialInput): client.BountyEventSubject {
  return {
    ...info,
    bountyId: bounty.id,
    bountyDescription: bounty.page.contentText,
    bountyRewardAmount: bounty.rewardAmount,
    bountyRewardChain: bounty.chainId,
    bountyRewardToken: bounty.rewardToken,
    bountyTitle: bounty.page.title,
    bountyUrl: `${DOMAIN}/${spaceDomain}/${bounty.page.id}`,
    workspaceId: 'not_an_id',
    workspaceUrl: `${DOMAIN}/${spaceDomain}`,
    workspaceName: spaceDomain
  };
}
