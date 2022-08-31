import { Bounty, Page } from '@prisma/client';
import * as client from './collablandClient';

const DOMAIN = process.env.DOMAIN;

interface CharmVerseBounty extends Bounty {
  page: Page;
}

interface RequestParams {
  bounty: CharmVerseBounty;
  aeToken: string;
  discordUserId: string;
  spaceDomain: string;
}

export function createBountyCreatedCredential ({ aeToken, bounty, discordUserId, spaceDomain }: RequestParams) {

  return client.createCredential({
    aeToken,
    credential: getCredentialInfo({
      bounty,
      spaceDomain,
      id: discordUserId,
      eventName: 'bounty_created',
      eventDate: new Date().toISOString()
    })
  });
}

export function createBountyStartedCredential ({ aeToken, bounty, discordUserId, spaceDomain }: RequestParams) {

  return client.createCredential({
    aeToken,
    credential: getCredentialInfo({
      bounty,
      spaceDomain,
      id: discordUserId,
      eventName: 'bounty_started',
      eventDate: new Date().toISOString()
    })
  });
}

export function createBountyCompletedCredential ({ aeToken, bounty, discordUserId, spaceDomain }: RequestParams) {

  return client.createCredential({
    aeToken,
    credential: getCredentialInfo({ bounty,
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
  eventName: client.CharmVerseBountyEvent['eventName'];
  eventDate: string;
}

function getCredentialInfo ({ bounty, spaceDomain, ...info }: GetCredentialInput): client.CharmVerseBountyEvent {
  return {
    ...info,
    bountyId: bounty.id,
    bountyDescription: bounty.page.contentText,
    bountyRewardAmount: bounty.rewardAmount,
    bountyRewardChain: bounty.chainId,
    bountyRewardToken: bounty.rewardToken,
    bountyTitle: bounty.page.title,
    bountyUrl: `${DOMAIN}/${spaceDomain}/${bounty.page.id}`
  };
}
