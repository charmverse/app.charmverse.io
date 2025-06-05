import type { SuperApiToken, Space as PrismaSpace } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { baseUrl } from '@packages/config/constants';
import { isValidUrl } from '@packages/lib/utils/isValidUrl';
import { WebhookEventNames } from '@packages/lib/webhookPublisher/interfaces';
import { publishMemberEvent } from '@packages/lib/webhookPublisher/publishEvent';
import { trackUserAction } from '@packages/metrics/mixpanel/trackUserAction';
import { updateTrackGroupProfile } from '@packages/metrics/mixpanel/updateTrackGroupProfile';
import { staticSpaceTemplates } from '@packages/spaces/config';
import { createOrGetUserFromWallet } from '@packages/users/createUser';
import { randomETHWalletAddress } from '@packages/utils/blockchain';
import { InvalidInputError } from '@packages/utils/errors';
import { uid } from '@packages/utils/strings';

import type { SpaceApiResponse } from 'lib/public-api/interfaces';
import type { SpaceCreateInput } from 'lib/spaces/createSpace';
import { createWorkspace } from 'lib/spaces/createSpace';
import { getAvailableDomainName } from 'lib/spaces/getAvailableDomainName';

import type { CreateWorkspaceRequestBody, CreateWorkspaceResponseBody } from './interfaces';

export async function createWorkspaceApi({
  name,
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
  const adminUserId = await createOrGetUserFromWallet({
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
