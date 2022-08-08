import fetch from 'adapters/http/fetch.server';
import log from 'lib/log';

const DOMAIN = 'https://api-qa.collab.land';
const API_KEY = process.env.COLLAB_API_KEY as string;

interface CollablandCredentialResponse {
  hash: string;
  verifiableCredential: {
    credentialSubject: {
      discordUserId: string; // '936350836110536735',
      discordUserName: string; // 'ghostpepper#7801',
      discordUserAvatar: string; // 'https://cdn.discordapp.com/avatars/936350836110536735/2ccdf2f75c168e3eb54f96c0981a5e86.webp',
      discordGuildId: string; // '943256209488748614',
      discordGuildName: string; // 'CollabLand Token Gated Server',
      discordGuildAvatar: string; // 'https://cdn.discordapp.com/icons/943256209488748614/4226079b4690b9a8bf1294f44402366a.webp',
      discordRoleId: string; // '-IflGlzZF95dnzRy8Ljsm:994305887286083705',
      discordRoleName: string; // 'SUPER-0',
      description: string; // 'ghostpepper#7801 is granted a guest pass SUPER-0 in Discord community CollabLand Token Gated Server',
      exp?: number; // 1662395622,
      id: string; // '936350836110536735'
    },
    issuer: {
      id: string; // 'did:ethr:rinkeby:0x038e829e042560e41de5a1f7c12aded55f95ea903465f7f9c8a805ed83f8cdc936'
    },
    id: string; // 'Z6s-qJzLBpNj9oAPKpcCN',
    type: 'VerifiableCredential' | 'GuestPass'[],
    '@context': 'https://www.w3.org/2018/credentials/v1'[],
    issuanceDate: string;
    proof: {
      'type': 'JwtProof2020';
      'jwt': string;
    }
  }
}

export interface CollablandCredential {
  id: string;
  createdAt: string;
  expiresAt: string | null;
  type: 'VerifiableCredential' | 'GuestPass'[];
  description: string; // 'ghostpepper#7801 is granted a guest pass SUPER-0 in Discord community CollabLand Token Gated Server',
  discord: {
    userId: string; // '936350836110536735',
    userName: string; // 'ghostpepper#7801',
    userAvatar: string; // 'https://cdn.gpp.com/avatars/936350836110536735/2ccdf2f75c168e3eb54f96c0981a5e86.webp',
    guildId: string; // '943256209488748614',
    guildName: string; // 'CollabLand Token Gated Server',
    guildAvatar: string; // 'https://cdn.gpp.com/icons/943256209488748614/4226079b4690b9a8bf1294f44402366a.webp',
    roles: {
      id: string; // '-IflGlzZF95dnzRy8Ljsm:994305887286083705',
      name: string; // 'SUPER-0'
    }[];
  };
}

export async function getCredentials ({ aeToken }: { aeToken: string }): Promise<CollablandCredential[]> {

  if (!API_KEY) {
    log.warn('No API Key provided for collab.land');
    return [];
  }

  const res = await fetch<CollablandCredentialResponse[]>(`${DOMAIN}/veramo/vcs`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-API-KEY': API_KEY,
      Authorization: `AE ${aeToken}`
    }
  });

  const credentials = res.map(({ verifiableCredential }): CollablandCredential => {
    return {
      id: verifiableCredential.id,
      createdAt: verifiableCredential.issuanceDate,
      expiresAt: verifiableCredential.credentialSubject.exp ? new Date(verifiableCredential.credentialSubject.exp).toISOString() : null,
      type: verifiableCredential.type,
      description: verifiableCredential.credentialSubject.description,
      discord: {
        userId: verifiableCredential.credentialSubject.discordUserId,
        userName: verifiableCredential.credentialSubject.discordUserName,
        userAvatar: verifiableCredential.credentialSubject.discordUserAvatar,
        guildId: verifiableCredential.credentialSubject.discordGuildId,
        guildName: verifiableCredential.credentialSubject.discordGuildName,
        guildAvatar: verifiableCredential.credentialSubject.discordGuildAvatar,
        roles: [{
          id: verifiableCredential.credentialSubject.discordRoleId,
          name: verifiableCredential.credentialSubject.discordRoleName
        }]
      }
    };
  })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .reduce<CollablandCredential[]>((newList, curr) => {
      const last = newList[newList.length - 1];
      // if previous VC was the same server and <24 hours, just append the roles
      const lastIsSameServer = last && last.discord.guildId === curr.discord.guildId;
      const lastIsRecent = last && new Date(last.createdAt).getTime() > new Date(curr.createdAt).getTime() - (24 * 60 * 60 * 1000);
      if (lastIsSameServer && lastIsRecent) {
        last.discord.roles.push(curr.discord.roles[0]);
      }
      else {
        newList.push(curr);
      }
      return newList;
    }, []);

  return credentials;
}
