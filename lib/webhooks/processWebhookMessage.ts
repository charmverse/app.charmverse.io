import { createAndAssignRolesDiscord } from 'lib/discord/createAndAssignRolesDiscord';
import { getSpaceFromDiscord } from 'lib/discord/getSpaceFromDiscord';
import { removeSpaceMemberDiscord } from 'lib/discord/removeSpaceMemberDiscord';
import { unassignRolesDiscord } from 'lib/discord/unassignRolesDiscord';
import log from 'lib/log';
import { getRequestApiKey } from 'lib/middleware/getRequestApiKey';
import { verifyApiKeyForSpace } from 'lib/middleware/verifyApiKeyForSpace';
import type { MemberRoleWebhookData, MemberWebhookData, MessageType, WebhookMessage } from 'lib/webhooks/interfaces';

const messageHandlers: Record<MessageType, (message: WebhookMessage) => Promise<boolean>> = {
  add_role: async (message: WebhookMessage) => {
    try {
      const {
        guild_id: discordServerId,
        member: { discordId: discordUserId },
        role
      } = message?.data as MemberRoleWebhookData;
      await createAndAssignRolesDiscord({ discordUserId, discordServerId, roles: role });
      return true;
    } catch (e) {
      return false;
    }
  },
  remove_role: async (message: WebhookMessage) => {
    try {
      const {
        guild_id: discordServerId,
        member: { discordId: discordUserId },
        role
      } = message?.data as MemberRoleWebhookData;
      await unassignRolesDiscord({ discordUserId, discordServerId, roles: role });
      return true;
    } catch (e) {
      return false;
    }
  },
  // TODO: we do not need add_member for now
  add_member: async (message: WebhookMessage) => true,
  remove_member: async (message: WebhookMessage) => {
    try {
      const {
        guild_id: discordServerId,
        member: { discordId: discordUserId }
      } = message?.data as MemberWebhookData;
      await removeSpaceMemberDiscord({ discordUserId, discordServerId });
      return true;
    } catch (e) {
      return false;
    }
  }
};

export async function processWebhookMessage(message: WebhookMessage) {
  const data = message?.data;

  if (!data?.type || !messageHandlers[data?.type]) {
    // we cannot process this message, just remove from queue
    return true;
  }

  const handler = messageHandlers[data?.type];
  const hasPermission = await verifyWebhookMessagePermission(message);
  if (!hasPermission) {
    log.warn('Webhook message without permission to be parsed', message);
    return true;
  }

  return handler(message);
}

export async function verifyWebhookMessagePermission(message: WebhookMessage) {
  const discordServerId = message?.data?.guild_id;
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
