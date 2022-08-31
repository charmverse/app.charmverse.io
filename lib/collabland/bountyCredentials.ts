import { Bounty, Page } from '@prisma/client';
import * as client from './collablandClient';

const DOMAIN = process.env.DOMAIN;

interface Space { id: string, domain: string, name: string }

interface RequestParams {
  bounty: Bounty;
  page: Page;
  space: Space;
  discordUserId: string;
}

export function createBountyCreatedCredential (params: RequestParams) {

  return client.createCredential({
    subject: getBountySubject({
      ...params,
      eventName: 'bounty_created',
      eventDate: new Date().toISOString()
    })
  });
}

export function createBountyStartedCredential (params: RequestParams) {

  return client.createCredential({
    subject: getBountySubject({
      ...params,
      eventName: 'bounty_started',
      eventDate: new Date().toISOString()
    })
  });
}

export function createBountyCompletedCredential (params: RequestParams) {

  return client.createCredential({
    subject: getBountySubject({
      ...params,
      eventName: 'bounty_completed',
      eventDate: new Date().toISOString()
    })
  });
}

// utils

interface BountySubjectParams extends RequestParams {
  eventName: client.BountyEventSubject['eventName'];
  eventDate: string;
}

function getBountySubject ({ bounty, discordUserId, page, space, ...info }: BountySubjectParams): client.BountyEventSubject {
  return {
    ...info,
    id: discordUserId,
    bountyId: bounty.id,
    bountyDescription: page.contentText,
    bountyRewardAmount: bounty.rewardAmount,
    bountyRewardChain: bounty.chainId,
    bountyRewardToken: bounty.rewardToken,
    bountyTitle: page.title,
    bountyUrl: `${DOMAIN}/${space.domain}/${page.id}`,
    workspaceId: space.id,
    workspaceUrl: `${DOMAIN}/${space.domain}`,
    workspaceName: space.name
  };
}
