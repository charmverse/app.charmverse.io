import { type PermissionsClient } from '@packages/core/permissions';

import { PublicForumPermissionsClient } from '../forum/client';
import { PublicProposalsPermissionsClient } from '../proposals/client';

export class PublicPermissionsClient implements PermissionsClient {
  forum = new PublicForumPermissionsClient();

  proposals = new PublicProposalsPermissionsClient();
}

export const publicPermissionsClient = new PublicPermissionsClient();
