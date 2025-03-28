import { log } from '@charmverse/core/log';
import { isTruthy } from '@packages/utils/types';
import { assignRolesCollabland } from '@root/lib/collabland/assignRolesCollabland';
import { disconnectSpace } from '@root/lib/collabland/disconnectSpace';
import { getSpacesFromDiscord } from '@root/lib/discord/getSpaceFromDiscord';
import { removeSpaceMemberDiscord } from '@root/lib/discord/removeSpaceMemberDiscord';
import { unassignRolesDiscord } from '@root/lib/discord/unassignRolesDiscord';
import { getRequestApiKey } from '@root/lib/middleware/getRequestApiKey';
import { verifyApiKeyForSpace } from '@root/lib/middleware/verifyApiKeyForSpace';

import type {
  MemberUpdateWebhookMessageData,
  MessageType,
  UninstallWebhookMessageData,
  WebhookMessage,
  WebhookMessageProcessResult
} from './interfaces';

const messageHandlers: Record<MessageType, (message: WebhookMessage<any>) => Promise<WebhookMessageProcessResult>> = {
  guildMemberUpdate: async (message: WebhookMessage<MemberUpdateWebhookMessageData>) => {
    let spaceIds: string[] = [];
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
        const result = await assignRolesCollabland({ discordUserId, discordServerId, roles: rolesAdded });
        spaceIds = result?.map((r) => (r.status === 'fulfilled' ? r.value?.spaceId : undefined)).filter(isTruthy) ?? [];
      }

      if (rolesRemoved.length) {
        const result = await unassignRolesDiscord({ discordUserId, discordServerId, roles: rolesRemoved });
        if (result?.spaceIds) {
          spaceIds = result.spaceIds;
        }
      }

      return {
        spaceIds,
        success: true,
        message: 'Roles updated.'
      };
      // eslint-disable-next-line no-empty
    } catch (e: any) {
      return {
        spaceIds,
        success: false,
        message: e?.message || 'Failed to process guildMemberUpdate event.'
      };
    }
  },
  guildMemberRemove: async (message: WebhookMessage<MemberUpdateWebhookMessageData>) => {
    try {
      const payload = message?.data?.payload?.[0];
      if (!payload) {
        return {
          success: false,
          message: 'Invalid payload.'
        };
      }

      const { guildId: discordServerId, userId: discordUserId } = payload;
      const result = await removeSpaceMemberDiscord({ discordUserId, discordServerId });

      return {
        spaceIds: result?.spaceIds ?? [],
        success: true,
        message: 'Member removed.'
      };
    } catch (e: any) {
      return {
        success: false,
        message: e?.message || 'Failed to process guildMemberRemove event.'
      };
    }
  },
  uninstallMiniapp: async (message: WebhookMessage<UninstallWebhookMessageData>) => {
    try {
      const payload = message?.data?.payload;
      if (!payload) {
        return {
          success: false,
          message: 'Invalid payload.'
        };
      }

      const { userId: discordUserId, guildId: discordServerId } = payload;
      const result = await disconnectSpace({ discordUserId, discordServerId });

      return {
        spaceIds: result.spaceIds,
        success: true,
        message: 'Uninstalled miniapp.'
      };
    } catch (e: any) {
      return {
        success: false,
        message: e?.message || 'Failed to process uninstall event.'
      };
    }
  }
};

export async function processWebhookMessage(message: WebhookMessage): Promise<WebhookMessageProcessResult> {
  const data = message?.data;

  if (!data?.event || !messageHandlers[data?.event] || !data?.payload) {
    // we cannot process this message, just remove from queue
    return {
      success: true,
      message: `Unsupported message type or payload: ${data?.event || 'undefined'}`
    };
  }

  const handler = messageHandlers[data?.event];
  log.debug('Processing webhook message from Collabland', { message, event: data?.event, payload: data?.payload });
  // API Tokens are not required for Collab.Land
  // const hasPermission = await verifyWebhookMessagePermission(message);
  // if (!hasPermission) {
  //   return {
  //     success: true,
  //     message: 'Webhook message from Collab.Land without permission to be parsed.'
  //   };
  // }

  return handler(message);
}

export async function verifyWebhookMessagePermission(message: WebhookMessage) {
  const payload = message?.data?.event === 'uninstallMiniapp' ? message?.data?.payload : message?.data?.payload?.[0];
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
