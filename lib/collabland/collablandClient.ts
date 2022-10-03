import fetch from 'adapters/http/fetch.server';
import log from 'lib/log';

const DOMAIN = 'https://api-qa.collab.land';
const API_KEY = process.env.COLLAB_API_KEY as string;

export interface BountyEventSubject {
  id: string; // discord user id
  bountyId: string;
  eventDate: string;
  eventName: 'bounty_created' | 'bounty_started' | 'bounty_completed'; // created, started, completed
  bountyDescription: string;
  bountyRewardAmount: number;
  bountyRewardChain: number;
  bountyRewardToken: string;
  bountyTitle: string;
  bountyUrl: string;
  workspaceId: string;
  workspaceName: string;
  workspaceUrl: string;
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
      'type': 'JwtProof2020';
      'jwt': string;
    };
  };
}

export type CollablandBountyEvent = CollablandCredential<BountyEventSubject>;

export type CollablandDiscordRole = CollablandCredential<DiscordRoleSubject>;

export type AnyCredentialType = CollablandBountyEvent | CollablandDiscordRole;

export function getCredentials ({ aeToken }: { aeToken: string }) {

  if (!API_KEY) {
    log.warn('No API Key provided for collab.land');
    return [];
  }

  return fetch<AnyCredentialType[]>(`${DOMAIN}/veramo/vcs`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-API-KEY': API_KEY,
      Authorization: `AE ${aeToken}`
    }
  });
}

// @ref: https://api-qa.collab.land/explorer/#/VeramoController/VeramoController.requestToIssueVcred
export function createCredential<T = BountyEventSubject> ({ subject }: { subject: T }) {

  if (!API_KEY) {
    log.warn('No API Key provided for collab.land');
    return null;
  }

  return fetch<CollablandCredential<T>>(`${DOMAIN}/veramo/vcreds`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-API-KEY': API_KEY
    },
    body: JSON.stringify({ credentialSubjects: [subject] })
  });
}
