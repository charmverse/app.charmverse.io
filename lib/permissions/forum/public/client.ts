import type { BaseForumPermissionsClient, CategoriesToFilter, PostCategoryWithPermissions } from '@charmverse/core';

import { computePostCategoryPermissions } from '../computePostCategoryPermissions';
import { computePostPermissions } from '../computePostPermissions';
import { getPermissionedCategories } from '../getPermissionedCategories';

export class PublicForumPermissionsClient implements BaseForumPermissionsClient {
  getPermissionedCategories = getPermissionedCategories;

  computePostPermissions = computePostPermissions;

  computePostCategoryPermissions = computePostCategoryPermissions;
}
