import { GET, POST } from '@charmverse/core/http';
import { getLogger } from '@charmverse/core/log';
import { isTestEnv } from '@root/config/constants';
import { COLLABLAND_API_URL, COLLAB_API_KEY } from '@root/lib/collabland/config';
import type { CollablandUserResult } from '@root/lib/collabland/interfaces';
import type { ExternalRole } from '@root/lib/roles';
import { RateLimit } from 'async-sema';

const log = getLogger('collabland-client');

const DEFAULT_HEADERS = {
  Accept: 'application/json',
  'Content-Type': 'application/json',
  'X-API-KEY': COLLAB_API_KEY
};

log.debug('Using collabland API URL:', COLLABLAND_API_URL);

const rateLimiter = RateLimit(1, { timeUnit: isTestEnv ? 1 : 5000 });

export interface BountyEventSubject {
  id: string; // discord user id
  bountyId: string;
  eventDate: string;
  eventName: 'bounty_created' | 'bounty_started' | 'bounty_completed'; // created, started, completed
  bountyDescription: string;
  bountyRewardAmount: number | null;
  bountyRewardChain: number | null;
  bountyRewardToken: string | null;
  bountyTitle: string;
  bountyUrl: string;
  workspaceId: string;
  workspaceName: string;
  workspaceUrl: string;
  bountyCustomReward: string | null;
}

export interface DiscordRoleSubject {
  discordUserId: string; // '936350836110536735',
  discordUserName: string; // 'ghostpepper#7801',
  discordUserAvatar: string; // 'https://cdn.discordapp.com/avatars/936350836110536735/2ccdf2f75c168e3eb54f96c0981a5e86.webp',
  discordGuildId: string; // '943256209488748614',
  discordGuildName: string; // 'Collabland Token Gated Server',
  discordGuildAvatar: string; // 'https://cdn.discordapp.com/icons/943256209488748614/4226079b4690b9a8bf1294f44402366a.webp',
  discordRoleId: string; // '-IflGlzZF95dnzRy8Ljsm:994305887286083705',
  discordRoleName: string; // 'SUPER-0',
  description: string; // 'ghostpepper#7801 is granted a guest pass SUPER-0 in Discord community Collabland Token Gated Server',
  exp?: number; // 1662395622,
  id: string; // '936350836110536735'
}

type CollablandCredential<T> = {
  hash: string;
  verifiableCredential: {
    credentialSubject: T;
    issuer: {
      id: string; // 'did:ethr:rinkeby:0x038e829e042560e41de5a1f7c12aded55f95ea903465f7f9c8a805ed83f8cdc936'
    };
    id: string; // 'Z6s-qJzLBpNj9oAPKpcCN',
    type: 'VerifiableCredential' | 'GuestPass'[];
    '@context': 'https://www.w3.org/2018/credentials/v1'[];
    issuanceDate: string; // '2022-08-31T03:37:49.000Z'
    proof: {
      type: 'JwtProof2020';
      jwt: string;
    };
  };
};

export type CollablandBountyEvent = CollablandCredential<BountyEventSubject>;

export type CollablandDiscordRole = CollablandCredential<DiscordRoleSubject>;

export type AnyCredentialType = CollablandBountyEvent | CollablandDiscordRole;

function getHeaders(customHeaders: HeadersInit = {}) {
  return {
    ...DEFAULT_HEADERS,
    ...customHeaders
  };
}

export function getCredentials({ aeToken }: { aeToken: string }) {
  if (!COLLAB_API_KEY) {
    log.warn('No API Key provided for collab.land');
    return [];
  }

  return GET<AnyCredentialType[]>(`${COLLABLAND_API_URL}/veramo/vcs`, null, {
    headers: getHeaders({
      Authorization: `AE ${aeToken}`
    })
  });
}

// @ref: https://api-qa.collab.land/explorer/#/VeramoController/VeramoController.requestToIssueVcred
export function createCredential<T = BountyEventSubject>({ subject }: { subject: T }) {
  if (!COLLAB_API_KEY) {
    log.warn('No API Key provided for collab.land');
    return null;
  }

  return POST<CollablandCredential<T>>(
    `${COLLABLAND_API_URL}/veramo/vcreds`,
    { credentialSubjects: [subject] },
    {
      headers: getHeaders()
    }
  );
}

export async function getDiscordUserState({
  discordServerId,
  discordUserId
}: {
  discordServerId: string;
  discordUserId: string;
}) {
  if (!COLLAB_API_KEY) {
    log.warn('No API Key provided for collab.land when calling getDiscordUserState');
    return {
      isVerified: false,
      roles: []
    };
  }
  await rateLimiter();
  try {
    const res = await GET<CollablandUserResult>(
      `${COLLABLAND_API_URL}/discord/${discordServerId}/member/${discordUserId}`,
      null,
      {
        headers: getHeaders()
      }
    );

    const serverRoles = await getGuildRoles(discordServerId);
    const userRoles: ExternalRole[] = [];
    res.roles?.forEach((roleId) => {
      const externalRole = serverRoles.find((role) => role.id === roleId);
      if (externalRole) {
        userRoles.push({ id: externalRole.id, name: externalRole.name });
      }
    });

    return {
      isVerified: !res.is_pending && !res.pending,
      roles: userRoles || []
    };
  } catch (e) {
    // 404 means Unknown Member
    if ((e as any).status === 404) {
      return {
        isVerified: false,
        roles: []
      };
    }
    throw e;
  }
}

export async function getGuildRoles(discordServerId: string) {
  if (!COLLAB_API_KEY) {
    log.warn('No API Key provided for collab.land when calling getGuildRoles');
    return [];
  }
  await rateLimiter();
  const allRoles = await GET<ExternalRole[]>(`${COLLABLAND_API_URL}/discord/${discordServerId}/roles`, null, {
    headers: getHeaders()
  });

  // filter out irrelevant roles
  return allRoles.filter((role) => role.name !== '@everyone' && !role.managed);
}
