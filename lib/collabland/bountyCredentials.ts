import { Bounty, Page } from '@prisma/client';
import * as client from './collablandClient';

const DOMAIN = process.env.DOMAIN;

interface CharmVerseBounty extends Bounty {
  page: Page;
  space: { domain: string, name: string };
}

interface RequestParams {
  bounty: CharmVerseBounty;
  discordUserId: string;
}

export function createBountyCreatedCredential ({ bounty, discordUserId }: RequestParams) {

  return client.createCredential({
    subject: getBountySubject({
      bounty,
      id: discordUserId,
      eventName: 'bounty_created',
      eventDate: new Date().toISOString()
    })
  });
}

export function createBountyStartedCredential ({ bounty, discordUserId }: RequestParams) {

  return client.createCredential({
    subject: getBountySubject({
      bounty,
      id: discordUserId,
      eventName: 'bounty_started',
      eventDate: new Date().toISOString()
    })
  });
}

export function createBountyCompletedCredential ({ bounty, discordUserId }: RequestParams) {

  return client.createCredential({
    subject: getBountySubject({
      bounty,
      id: discordUserId,
      eventName: 'bounty_completed',
      eventDate: new Date().toISOString()
    })
  });
}

// utils

interface BountySubjectParams {
  bounty: CharmVerseBounty;
  id: string;
  eventName: client.BountyEventSubject['eventName'];
  eventDate: string;
}

function getBountySubject ({ bounty, ...info }: BountySubjectParams): client.BountyEventSubject {
  return {
    ...info,
    bountyId: bounty.id,
    bountyDescription: bounty.page.contentText,
    bountyRewardAmount: bounty.rewardAmount,
    bountyRewardChain: bounty.chainId,
    bountyRewardToken: bounty.rewardToken,
    bountyTitle: bounty.page.title,
    bountyUrl: `${DOMAIN}/${bounty.space.domain}/${bounty.page.id}`,
    workspaceId: 'not_an_id',
    workspaceUrl: `${DOMAIN}/${bounty.space.domain}`,
    workspaceName: bounty.space.name
  };
}
