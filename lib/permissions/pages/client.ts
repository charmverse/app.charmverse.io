import type { BasePagePermissionsClient } from '@charmverse/core';

import { computePagePermissions } from './computePagePermissions';
import { getAccessiblePages } from './getAccessiblePages';

export class PublicPagePermissionsClient implements BasePagePermissionsClient {
  computePagePermissions = computePagePermissions;

  getAccessiblePages = getAccessiblePages;
}
