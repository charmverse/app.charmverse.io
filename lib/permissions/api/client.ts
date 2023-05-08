import type { PermissionsClient } from '@charmverse/core';

import { PublicForumPermissionsClient } from 'lib/permissions/forum/client';
import { PublicProposalsPermissionsClient } from 'lib/permissions/proposals/client';

export class PublicPermissionsClient implements PermissionsClient {
  forum = new PublicForumPermissionsClient();

  proposals = new PublicProposalsPermissionsClient();
}

export const publicPermissionsClient = new PublicPermissionsClient();
