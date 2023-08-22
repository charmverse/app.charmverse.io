import type { SuperApiToken, Space as PrismaSpace } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';

import { baseUrl } from 'config/constants';
import { upsertSpaceRolesFromDiscord } from 'lib/discord/upsertSpaceRolesFromDiscord';
import { upsertUserForDiscordId } from 'lib/discord/upsertUserForDiscordId';
import { upsertUserRolesFromDiscord } from 'lib/discord/upsertUserRolesFromDiscord';
import { trackUserAction } from 'lib/metrics/mixpanel/trackUserAction';
import { updateTrackGroupProfile } from 'lib/metrics/mixpanel/updateTrackGroupProfile';
import type { SpaceApiResponse } from 'lib/public-api/interfaces';
import { staticSpaceTemplates } from 'lib/spaces/config';
import type { SpaceCreateInput } from 'lib/spaces/createSpace';
import { createWorkspace } from 'lib/spaces/createSpace';
import { getAvailableDomainName } from 'lib/spaces/getAvailableDomainName';
import { createUserFromWallet } from 'lib/users/createUser';
import { InvalidInputError } from 'lib/utilities/errors';
import { isValidUrl } from 'lib/utilities/isValidUrl';
import { uid } from 'lib/utilities/strings';
import { WebhookEventNames } from 'lib/webhookPublisher/interfaces';
import { publishMemberEvent } from 'lib/webhookPublisher/publishEvent';

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
    : await createUserFromWallet({ address: adminWalletAddress, avatar: adminAvatar }).then((user) => user.id);

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
    await upsertSpaceRolesFromDiscord({ space, userId: botUser.id });
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
