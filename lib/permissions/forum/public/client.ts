import type { BaseForumPermissionsClient } from '@charmverse/core';

import { computePostCategoryPermissions } from '../computePostCategoryPermissions';
import { computePostPermissions } from '../computePostPermissions';

export class PublicForumPermissionsClient implements BaseForumPermissionsClient {
  computePostPermissions = computePostPermissions;

  computePostCategoryPermissions = computePostCategoryPermissions;
}
