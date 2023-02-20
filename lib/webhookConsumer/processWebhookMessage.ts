import { assignRolesCollabland } from 'lib/collabland/assignRolesCollabland';
import { getSpacesFromDiscord } from 'lib/discord/getSpaceFromDiscord';
import { removeSpaceMemberDiscord } from 'lib/discord/removeSpaceMemberDiscord';
import { unassignRolesDiscord } from 'lib/discord/unassignRolesDiscord';
import { getRequestApiKey } from 'lib/middleware/getRequestApiKey';
import { verifyApiKeyForSpace } from 'lib/middleware/verifyApiKeyForSpace';
import type { MessageType, WebhookMessage, WebhookMessageProcessResult } from 'lib/webhookConsumer/interfaces';

const messageHandlers: Record<MessageType, (message: WebhookMessage) => Promise<WebhookMessageProcessResult>> = {
  guildMemberUpdate: async (message: WebhookMessage) => {
    try {
      const payload = message?.data?.payload;
      if (!payload || payload.length !== 2) {
        return {
          success: false,
          message: 'Invalid payload.'
        };
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

      return {
        success: true,
        message: 'Roles updated.'
      };
      // eslint-disable-next-line no-empty
    } catch (e: any) {
      return {
        success: false,
        message: e?.message || 'Failed to process guildMemberUpdate event.'
      };
    }
  },
  guildMemberRemove: async (message: WebhookMessage) => {
    try {
      const payload = message?.data?.payload?.[0];
      if (!payload) {
        return {
          success: false,
          message: 'Invalid payload.'
        };
      }

      const { guildId: discordServerId, userId: discordUserId } = payload;
      await removeSpaceMemberDiscord({ discordUserId, discordServerId });

      return {
        success: true,
        message: 'Member removed.'
      };
    } catch (e: any) {
      return {
        success: false,
        message: e?.message || 'Failed to process guildMemberRemove event.'
      };
    }
  }
};

export async function processWebhookMessage(message: WebhookMessage): Promise<WebhookMessageProcessResult> {
  const data = message?.data;

  if (!data?.event || !messageHandlers[data?.event] || !data?.payload) {
    // we cannot process this message, just remove from queue
    return {
      success: false,
      message: 'Unsupported message type or payload.'
    };
  }

  const handler = messageHandlers[data?.event];
  const hasPermission = await verifyWebhookMessagePermission(message);
  if (!hasPermission) {
    return {
      success: false,
      message: 'Webhook message without permission to be parsed.'
    };
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
    const spaces = await getSpacesFromDiscord(discordServerId);

    return spaces.some((space) => verifyApiKeyForSpace({ apiKey, spaceId: space.id }));
  } catch (e) {
    return false;
  }
}
