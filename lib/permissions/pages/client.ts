import type { BasePagePermissionsClient } from '@charmverse/core/permissions';

import { computePagePermissions } from './computePagePermissions';
import { getAccessiblePages } from './getAccessiblePages';

export class PublicPagePermissionsClient implements BasePagePermissionsClient {
  computePagePermissions = computePagePermissions;

  getAccessiblePages = getAccessiblePages;
}
