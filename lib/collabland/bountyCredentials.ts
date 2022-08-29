
import { Bounty } from '@prisma/client';
import { BountyWithDetails } from 'models';
import * as client from './collablandClient';

const DOMAIN = process.env.DOMAIN;

interface RequestParams {
  bounty: BountyWithDetails;
  aeToken: string;
  discordUserId: string;
  spaceDomain: string;
}

function getCredentialFromBounty ({ bounty, spaceDomain }: { bounty: BountyWithDetails, spaceDomain: string }) {
  return {
    bountyId: bounty.id,
    bountyDescription: bounty.page.contentText,
    bountyRewardAmount: bounty.rewardAmount,
    bountyRewardChain: bounty.chainId,
    bountyRewardToken: bounty.rewardToken,
    bountyTitle: bounty.page.title,
    bountyUrl: `${DOMAIN}/${spaceDomain}/${bounty.page.id}`
  };
}

export function createBountyCreatedCredential ({ aeToken, bounty, discordUserId, spaceDomain }: RequestParams) {

  return client.createCredential({
    aeToken,
    credential: {
      ...getCredentialFromBounty({ bounty, spaceDomain }),
      id: discordUserId,
      eventName: 'bounty_created',
      eventDate: new Date().toISOString()
    }
  });
}

export function createBountyStartedCredential ({ aeToken, bounty, discordUserId, spaceDomain }: RequestParams) {

  return client.createCredential({
    aeToken,
    credential: {
      ...getCredentialFromBounty({ bounty, spaceDomain }),
      id: discordUserId,
      eventName: 'bounty_started',
      eventDate: new Date().toISOString()
    }
  });
}

export function createBountyCompletedCredential ({ aeToken, bounty, discordUserId, spaceDomain }: RequestParams) {

  return client.createCredential({
    aeToken,
    credential: {
      ...getCredentialFromBounty({ bounty, spaceDomain }),
      id: discordUserId,
      eventName: 'bounty_completed',
      eventDate: new Date().toISOString()
    }
  });
}
