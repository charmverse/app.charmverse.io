import { Bounty, Page } from '@prisma/client';
import { prisma } from 'db';
import * as client from './collablandClient';

const DOMAIN = process.env.DOMAIN || 'https://test.charmverse.io';

interface Space { id: string, domain: string, name: string }

interface RequestParams {
  bounty: Bounty;
  page: Page;
  space: Space;
  discordUserId: string;
}

export async function createBountyCreatedCredential ({ bountyId }: { bountyId: string }) {

  const bounty = await prisma.bounty.findUniqueOrThrow({
    where: {
      id: bountyId
    },
    include: {
      author: {
        include: {
          discordUser: true
        }
      },
      space: true,
      page: true
    }
  });

  if (bounty.page && bounty.author.discordUser) {
    return client.createCredential({
      subject: getBountySubject({
        bounty,
        page: bounty.page,
        space: bounty.space,
        discordUserId: bounty.author.discordUser.discordId,
        eventName: 'bounty_created',
        eventDate: new Date().toISOString()
      })
    });
  }
}

export async function createBountyStartedCredential ({ bountyId, userId }: { bountyId: string, userId: string }) {

  const bounty = await prisma.bounty.findUniqueOrThrow({
    where: {
      id: bountyId
    },
    include: {
      space: true,
      page: true
    }
  });

  const author = await prisma.user.findUnique({
    where: {
      id: userId
    },
    include: {
      discordUser: true
    }
  });

  if (bounty.page && author?.discordUser) {
    return client.createCredential({
      subject: getBountySubject({
        bounty,
        page: bounty.page,
        space: bounty.space,
        discordUserId: author.discordUser.discordId,
        eventName: 'bounty_started',
        eventDate: new Date().toISOString()
      })
    });
  }

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
