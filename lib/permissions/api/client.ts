import type { PermissionsClient } from '@charmverse/core/permissions';

import { PublicForumPermissionsClient } from 'lib/permissions/forum/client';
import { PublicProposalsPermissionsClient } from 'lib/permissions/proposals/client';

import { PublicPagePermissionsClient } from '../pages/client';
import { PublicSpacePermissionsClient } from '../spaces/client';

export class PublicPermissionsClient implements PermissionsClient {
  forum = new PublicForumPermissionsClient();

  proposals = new PublicProposalsPermissionsClient();

  pages = new PublicPagePermissionsClient();

  spaces = new PublicSpacePermissionsClient();
}

export const publicPermissionsClient = new PublicPermissionsClient();
