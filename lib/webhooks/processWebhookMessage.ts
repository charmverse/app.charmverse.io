import { assignRolesCollabland } from 'lib/collabland/assignRolesCollabland';
import { getSpaceFromDiscord } from 'lib/discord/getSpaceFromDiscord';
import { removeSpaceMemberDiscord } from 'lib/discord/removeSpaceMemberDiscord';
import { unassignRolesDiscord } from 'lib/discord/unassignRolesDiscord';
import log from 'lib/log';
import { getRequestApiKey } from 'lib/middleware/getRequestApiKey';
import { verifyApiKeyForSpace } from 'lib/middleware/verifyApiKeyForSpace';
import type { MessageType, WebhookMessage } from 'lib/webhooks/interfaces';

const messageHandlers: Record<MessageType, (message: WebhookMessage) => Promise<void>> = {
  guildMemberUpdate: async (message: WebhookMessage) => {
    try {
      const payload = message?.data?.payload;
      if (!payload || payload.length !== 2) {
        return;
      }

      const { guildId: discordServerId, userId: discordUserId } = payload[0];

      const [oldMemberData, newMemberData] = payload;
      const oldRoles = oldMemberData.roles;
      const newRoles = newMemberData.roles;

      const rolesAdded = newRoles.filter((role) => !oldRoles.includes(role));
      const rolesRemoved = oldRoles.filter((role) => !newRoles.includes(role));

      if (rolesAdded.length) {
        await assignRolesCollabland({ discordUserId, discordServerId, roles: rolesAdded });
      }

      if (rolesRemoved.length) {
        await unassignRolesDiscord({ discordUserId, discordServerId, roles: rolesRemoved });
      }
      // eslint-disable-next-line no-empty
    } catch (e) {}
  },
  guildMemberRemove: async (message: WebhookMessage) => {
    try {
      const payload = message?.data?.payload?.[0];
      if (!payload) {
        return;
      }

      const { guildId: discordServerId, userId: discordUserId } = payload;
      await removeSpaceMemberDiscord({ discordUserId, discordServerId });
      // eslint-disable-next-line no-empty
    } catch (e) {}
  }
};

export async function processWebhookMessage(message: WebhookMessage) {
  const data = message?.data;

  if (!data?.event || !messageHandlers[data?.event] || !data?.payload) {
    // we cannot process this message, just remove from queue
    return;
  }

  const handler = messageHandlers[data?.event];
  const hasPermission = await verifyWebhookMessagePermission(message);
  if (!hasPermission) {
    log.warn('Webhook message without permission to be parsed', message);
    return;
  }

  return handler(message);
}

export async function verifyWebhookMessagePermission(message: WebhookMessage) {
  const payload = message?.data?.payload?.[0];
  const discordServerId = payload?.guildId;
  const apiKey = getRequestApiKey({ headers: message?.headers || {}, query: message?.query });

  if (!discordServerId || !apiKey) {
    return false;
  }

  try {
    const space = await getSpaceFromDiscord(discordServerId);

    return verifyApiKeyForSpace({ apiKey, spaceId: space.id });
  } catch (e) {
    return false;
  }
}
