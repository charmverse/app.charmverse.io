import type { Bounty, Page, Space } from '@prisma/client';

import * as http from 'adapters/http';
import { isProdEnv, isTestEnv } from 'config/constants';
import { prisma } from 'db';
import log from 'lib/log';

/**
 * Full JSON body available here
 * @see https://discord.com/developers/docs/resources/webhook#webhook-object-jsonform-params
 */
export interface IDiscordMessage {
  content: string;
}

export interface UserSpaceAction {
  userId: string;
  spaceId: string;
}

/// ------ Event types
export type FunnelEvent = 'awareness' | 'acquisition' | 'activation' | 'revenue' | 'referral';

export type EventType = 'create_user' | 'create_workspace'| 'first_user_create_page' | 'first_workspace_create_page' | 'create_bounty' | 'first_user_create_bounty' | 'first_workspace_create_bounty' | 'join_workspace_from_link' | 'first_user_proposal_create' | 'first_user_proposal_template_create' | 'first_workspace_proposal_create' | 'first_workspace_proposal_template_create';

/// ------
/**
 * @origin the website from where this request originated
 */
export interface IEventToLog {
  funnelStage: FunnelEvent;
  eventType: EventType;
  message: string;
}

const isProdEnvironment = isProdEnv;
const webhook = process.env.DISCORD_EVENTS_WEBHOOK;

export async function postToDiscord (eventLog: IEventToLog) {

  let message = `Event: **${eventLog.funnelStage.toUpperCase()}**  / ${eventLog.eventType}\r\n`;

  message += eventLog.message;

  log.debug('New event logged', message);

  if (isProdEnvironment && webhook) {

    try {
      const discordReponse = await http.POST<IDiscordMessage>(webhook, { content: message });
      return discordReponse;
    }
    catch (error) {
      log.warn('Error posting to discord', error);
    }

  }

}
// ----- List of events

export async function logFirstProposal ({ spaceId, userId }: UserSpaceAction) {

  const space = await prisma.space.findUnique({
    where: {
      id: spaceId
    },
    select: {
      domain: true
    }
  });

  const [userProposals, spaceProposals] = await Promise.all([prisma.proposal.count({
    where: {
      createdBy: userId,
      page: {
        type: 'proposal'
      }
    }
  }), prisma.proposal.count({
    where: {
      spaceId,
      page: {
        type: 'proposal'
      }
    }
  })]);

  if (userProposals === 1) {
    const eventLog: IEventToLog = {
      eventType: 'first_user_proposal_create',
      funnelStage: 'activation',
      message: `Someone inside ${space?.domain} workspace created their first proposal`
    };
    postToDiscord(eventLog);
  }

  if (spaceProposals === 1) {
    const eventLog: IEventToLog = {
      eventType: 'first_workspace_proposal_create',
      funnelStage: 'activation',
      message: `The ${space?.domain} workspace just created its first proposal`
    };
    postToDiscord(eventLog);
  }

}

export async function logFirstProposalTemplate ({ spaceId, userId }: UserSpaceAction) {
  const space = await prisma.space.findUnique({
    where: {
      id: spaceId
    },
    select: {
      domain: true
    }
  });

  const [userProposals, spaceProposals] = await Promise.all([prisma.proposal.count({
    where: {
      createdBy: userId,
      page: {
        type: 'proposal_template'
      }
    }
  }), prisma.proposal.count({
    where: {
      spaceId,
      page: {
        type: 'proposal_template'
      }
    }
  })]);

  if (userProposals === 1) {
    const eventLog: IEventToLog = {
      eventType: 'first_user_proposal_create',
      funnelStage: 'activation',
      message: `Someone inside ${space?.domain} workspace created their first proposal template`
    };
    postToDiscord(eventLog);
  }

  if (spaceProposals === 1) {
    const eventLog: IEventToLog = {
      eventType: 'first_workspace_proposal_create',
      funnelStage: 'activation',
      message: `The ${space?.domain} workspace just created its first proposal template`
    };
    postToDiscord(eventLog);
  }
}

export async function logSignupViaDiscord () {
  postToDiscord({
    funnelStage: 'acquisition',
    eventType: 'create_user',
    message: 'A new user has joined Charmverse using their Discord account'
  });
}

export async function logWorkspaceFirstBountyEvents (bounty: Bounty) {
  const bountiesInWorkspace = await prisma.bounty.findMany({
    where: {
      spaceId: bounty.spaceId
    }
  });

  // Only 1 bounty exists
  if (bountiesInWorkspace.length === 1) {

    const workspace = await prisma.space.findUnique({
      where: {
        id: bounty.spaceId
      },
      select: {
        domain: true
      }
    });

    const event: IEventToLog = {
      eventType: 'first_workspace_create_bounty',
      funnelStage: 'activation',
      message: `${workspace?.domain} workspace just posted its first bounty`
    };

    postToDiscord(event);
    return true;
  }
  return false;
}

export async function logUserFirstBountyEvents (bounty: Bounty) {
  const bountiesFromUser = await prisma.bounty.findMany({
    where: {
      createdBy: bounty.createdBy
    }
  });

  if (bountiesFromUser.length === 1) {

    const workspace = await prisma.space.findUnique({
      where: {
        id: bounty.spaceId
      },
      select: {
        domain: true
      }
    });

    const event: IEventToLog = {
      eventType: 'first_user_create_bounty',
      funnelStage: 'activation',
      message: `A user just created their first bounty inside the ${workspace?.domain} workspace`
    };

    postToDiscord(event);
    return true;
  }
  return false;
}

/**
 * Assumes that a first page will be created by the system
 * Should be called after a page is created
 * @param page
 */
export async function logInviteAccepted ({ spaceId }: Omit<UserSpaceAction, 'userId'>) {

  const space = await prisma.space.findUnique({
    where: {
      id: spaceId
    },
    select: {
      domain: true
    }
  });

  const eventLog: IEventToLog = {
    eventType: 'join_workspace_from_link',
    funnelStage: 'acquisition',
    message: `Someone joined ${space?.domain} workspace via an invite link`
  };

  postToDiscord(eventLog);
}

/**
 * Assumes that a first page will be created by the system
 * Should be called after a page is created
 * @param page
 */
export async function logFirstWorkspacePageCreation (page: Page) {
  const workspaceCreatedPages = await prisma.page.count({
    where: {
      spaceId: page.spaceId,
      autoGenerated: {
        not: true
      }
    }
  });

  // Default page plus the just created page
  if (workspaceCreatedPages === 1) {

    const space = await prisma.space.findUnique({
      where: {
        id: page.spaceId!
      },
      select: {
        domain: true
      }
    });

    const eventLog: IEventToLog = {
      eventType: 'first_workspace_create_page',
      funnelStage: 'activation',
      message: `First page created in ${space!.domain} workspace`
    };

    postToDiscord(eventLog);
  }
}

/**
 * Assumes that a first page will be created by the system
 * Should be called after a page is created
 * @param page
 */
export async function logFirstUserPageCreation (page: Page) {
  const userCreatedPages = await prisma.page.count({
    where: {
      createdBy: page.createdBy,
      autoGenerated: {
        not: true
      }
    }
  });

  // Default page plus the just created page
  if (userCreatedPages === 1) {

    const space = await prisma.space.findUnique({
      where: {
        id: page.spaceId!
      },
      select: {
        domain: true
      }
    });

    const eventLog: IEventToLog = {
      eventType: 'first_user_create_page',
      funnelStage: 'activation',
      message: `A user just created their first page. This happened in the ${space!.domain} workspace`
    };

    postToDiscord(eventLog);
  }
}

export async function logSignupViaWallet () {
  postToDiscord({
    funnelStage: 'acquisition',
    eventType: 'create_user',
    message: 'A new user has joined Charmverse using their Web3 wallet'
  });
}

export function logSpaceCreation (space: Space) {
  const eventLog: IEventToLog = {
    funnelStage: 'acquisition',
    eventType: 'create_workspace',
    message: `New workspace ${space.domain} has just been created`
  };

  postToDiscord(eventLog);
}

export async function logWorkspaceJoinedViaTokenGate (spaceId: string) {

  const space = await prisma.space.findUnique({
    where: {
      id: spaceId
    },
    select: {
      domain: true
    }
  });

  if (space) {
    postToDiscord({
      funnelStage: 'acquisition',
      eventType: 'create_user',
      message: `A user has joined the ${space.domain} workspace via token gate.`
    });
  }

}

