import type { ForumPermissionsClient } from '@charmverse/core';

import { computePostCategoryPermissions } from './computePostCategoryPermissions';
import { computePostPermissions } from './computePostPermissions';

export class PublicForumPermissionsClient implements ForumPermissionsClient {
  computePostPermissions = computePostPermissions;

  computePostCategoryPermissions = computePostCategoryPermissions;
}
