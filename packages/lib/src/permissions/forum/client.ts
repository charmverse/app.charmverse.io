import type { BaseForumPermissionsClient } from '@packages/core/permissions';

import { computePostCategoryPermissions } from './computePostCategoryPermissions';
import { computePostPermissions } from './computePostPermissions';
import { getPermissionedCategories } from './getPermissionedCategories';

export class PublicForumPermissionsClient implements BaseForumPermissionsClient {
  getPermissionedCategories = getPermissionedCategories;

  computePostPermissions = computePostPermissions;

  computePostCategoryPermissions = computePostCategoryPermissions;
}
