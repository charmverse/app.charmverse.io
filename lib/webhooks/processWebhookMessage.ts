import { createAndAssignRolesDiscord } from 'lib/discord/createAndAssignRolesDiscord';
import { removeSpaceMemberDiscord } from 'lib/discord/removeSpaceMemberDiscord';
import { unassignRolesDiscord } from 'lib/discord/unassignRolesDiscord';
import type { MemberRoleWebhookData, MemberWebhookData, MessageType, WebhookMessage } from 'lib/webhooks/interfaces';

const messageHandlers: Record<MessageType, (message: WebhookMessage) => Promise<boolean>> = {
  remove_role: async (message: WebhookMessage) => {
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
  add_role: async (message: WebhookMessage) => {
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

  return handler(message);
}
