import type { PermissionsClient } from '@charmverse/core';

import { PublicForumPermissionsClient } from 'lib/permissions/forum/public/client';

export class PublicPermissionsClient implements PermissionsClient {
  forum = new PublicForumPermissionsClient();
}

export const publicPermissionsClient = new PublicPermissionsClient();
