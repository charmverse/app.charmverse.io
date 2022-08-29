
import * as client from './collablandClient';

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

  const res = await client.getCredentials({ aeToken });

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

export async function createCredential ({ aeToken }: { aeToken: string }) {
  await client.createCredential({ aeToken });
}
