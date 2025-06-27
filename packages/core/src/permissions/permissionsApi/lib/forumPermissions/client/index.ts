import type { PremiumForumPermissionsClient } from '@packages/core/permissions';

import { assignDefaultPostCategoryPermissions } from '../assignDefaultPostCategoryPermission';
import { computePostCategoryPermissions } from '../computePostCategoryPermissions';
import { computePostPermissions } from '../computePostPermissions';
import { deletePostCategoryPermission } from '../deletePostCategoryPermission';
import { getPermissionedCategories } from '../getPermissionedCategories';
import { mutatePostCategorySearch } from '../mutatePostCategorySearch';
import { upsertPostCategoryPermission } from '../upsertPostCategoryPermission';

export class ForumPermissionsClient implements PremiumForumPermissionsClient {
  computePostPermissions = computePostPermissions;

  computePostCategoryPermissions = computePostCategoryPermissions;

  assignDefaultPostCategoryPermissions = assignDefaultPostCategoryPermissions;

  upsertPostCategoryPermission = upsertPostCategoryPermission;

  deletePostCategoryPermission = deletePostCategoryPermission;

  mutatePostCategorySearch = mutatePostCategorySearch;

  getPermissionedCategories = getPermissionedCategories;
}
