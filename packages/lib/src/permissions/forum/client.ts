import type { BaseForumPermissionsClient } from '@charmverse/core/permissions';

import { computePostCategoryPermissions } from './computePostCategoryPermissions';
import { computePostPermissions } from './computePostPermissions';
import { getPermissionedCategories } from './getPermissionedCategories';

export class PublicForumPermissionsClient implements BaseForumPermissionsClient {
  getPermissionedCategories = getPermissionedCategories;

  computePostPermissions = computePostPermissions;

  computePostCategoryPermissions = computePostCategoryPermissions;
}
