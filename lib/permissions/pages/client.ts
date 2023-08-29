import type { BasePagePermissionsClient } from '@charmverse/core/permissions';

import { bulkComputePagePermissions } from './bulkComputePagePermissions';
import { computePagePermissions } from './computePagePermissions';
import { getAccessiblePageIds } from './getAccessiblePageIds';
import { getAccessiblePages } from './getAccessiblePages';

export class PublicPagePermissionsClient implements BasePagePermissionsClient {
  bulkComputePagePermissions = bulkComputePagePermissions;

  getAccessiblePageIds = getAccessiblePageIds;

  computePagePermissions = computePagePermissions;

  getAccessiblePages = getAccessiblePages;
}
