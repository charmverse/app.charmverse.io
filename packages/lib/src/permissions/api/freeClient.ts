import { type PermissionsClient } from '@charmverse/core/permissions';
import { PublicForumPermissionsClient } from '@packages/lib/permissions/forum/client';
import { PublicProposalsPermissionsClient } from '@packages/lib/permissions/proposals/client';

export class PublicPermissionsClient implements PermissionsClient {
  forum = new PublicForumPermissionsClient();

  proposals = new PublicProposalsPermissionsClient();
}

export const publicPermissionsClient = new PublicPermissionsClient();
