import type { SuperApiToken, Space as PrismaSpace } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { trackUserAction } from '@packages/metrics/mixpanel/trackUserAction';
import { updateTrackGroupProfile } from '@packages/metrics/mixpanel/updateTrackGroupProfile';
import { createOrGetUserFromWallet } from '@packages/users/createUser';
import { randomETHWalletAddress } from '@packages/utils/blockchain';
import { InvalidInputError } from '@packages/utils/errors';
import { uid } from '@packages/utils/strings';
import { baseUrl } from '@root/config/constants';
import { upsertSpaceRolesFromDiscord } from '@root/lib/discord/collabland/upsertSpaceRolesFromDiscord';
import { upsertUserRolesFromDiscord } from '@root/lib/discord/collabland/upsertUserRolesFromDiscord';
import { upsertUserForDiscordId } from '@root/lib/discord/upsertUserForDiscordId';
import type { SpaceApiResponse } from '@root/lib/public-api/interfaces';
import { staticSpaceTemplates } from '@root/lib/spaces/config';
import type { SpaceCreateInput } from '@root/lib/spaces/createSpace';
import { createWorkspace } from '@root/lib/spaces/createSpace';
import { getAvailableDomainName } from '@root/lib/spaces/getAvailableDomainName';
import { isValidUrl } from '@root/lib/utils/isValidUrl';
import { WebhookEventNames } from '@root/lib/webhookPublisher/interfaces';
import { publishMemberEvent } from '@root/lib/webhookPublisher/publishEvent';

import type { CreateWorkspaceRequestBody, CreateWorkspaceResponseBody } from './interfaces';

export async function createWorkspaceApi({
  name,
  discordServerId,
  adminDiscordUserId,
  adminWalletAddress,
  adminUsername,
  adminAvatar,
  xpsEngineId,
  avatar,
  superApiToken,
  webhookUrl,
  template
}: CreateWorkspaceRequestBody & { superApiToken?: SuperApiToken | null }): Promise<CreateWorkspaceResponseBody> {
  // Retrieve an id for the admin user
  const adminUserId = adminDiscordUserId
    ? await upsertUserForDiscordId({ discordId: adminDiscordUserId, username: adminUsername, avatar: adminAvatar })
    : await createOrGetUserFromWallet({
        address: adminWalletAddress ?? randomETHWalletAddress(),
        avatar: adminAvatar
      }).then(({ user }) => user.id);

  if (!adminUserId) {
    throw new InvalidInputError('No admin user ID created.');
  }

  // create new bot user as space creator
  const botUser = await prisma.user.create({
    data: {
      username: 'Bot',
      isBot: true,
      identityType: 'RandomName',
      path: uid()
    }
  });

  // generate a domain name based on space
  const spaceDomain = await getAvailableDomainName(name);

  // Create workspace
  const spaceData: SpaceCreateInput = {
    name,
    updatedBy: botUser.id,
    domain: spaceDomain,
    spaceImage: avatar && isValidUrl(avatar) ? avatar : undefined,
    discordServerId,
    xpsEngineId,
    superApiTokenId: superApiToken?.id
  };

  const internalTemplate = staticSpaceTemplates.find((tpl) => tpl.apiName === template)?.id ?? 'templateNftCommunity';

  const space = await createWorkspace({
    spaceData,
    userId: adminUserId,
    webhookUrl,
    extraAdmins: [botUser.id],
    spaceTemplate: internalTemplate
  });

  // create roles from discord
  if (discordServerId) {
    await upsertSpaceRolesFromDiscord({ spaceId: space.id, discordServerId, userId: botUser.id });
  }

  // assing roles to discord admin user
  if (adminDiscordUserId) {
    await upsertUserRolesFromDiscord({ space, userId: adminUserId });
  }

  trackUserAction('join_a_workspace', { spaceId: space.id, userId: adminUserId, source: 'charmverse_api' });
  trackUserAction('create_new_workspace', {
    userId: adminUserId,
    spaceId: space.id,
    template: internalTemplate,
    source: superApiToken?.name || 'charmverse_api'
  });
  updateTrackGroupProfile(space, superApiToken?.name);

  publishMemberEvent({
    scope: WebhookEventNames.UserJoined,
    spaceId: space.id,
    userId: adminUserId
  });

  return {
    ...mapSpace(space),
    webhookSigningSecret: space.webhookSigningSecret ?? undefined
  };
}

export function mapSpace(space: PrismaSpace): SpaceApiResponse {
  return {
    id: space.id,
    createdAt: space.createdAt.toString(),
    createdBy: space.createdBy,
    name: space.name,
    spaceUrl: `${baseUrl}/${space.domain}`,
    joinUrl: `${baseUrl}/join?domain=${space.domain}`
  };
}
