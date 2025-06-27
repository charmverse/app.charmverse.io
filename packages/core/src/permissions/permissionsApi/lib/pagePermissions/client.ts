import type { PagePermissionsClient as PagePermissionsClientInterface } from '@packages/core/permissions';

import { bulkComputePagePermissions } from './bulkComputePagePermissions';
import { computePagePermissions } from './computePagePermissions';
import { deletePagePermission } from './deletePagePermission';
import { getAccessiblePageIds } from './getAccessiblePageIds';
import { handlePageEvent } from './handlePageEvent';
import { isBountyPageEditableByApplicants } from './isBountyPageEditableByApplicants';
import { listPagePermissions } from './listPagePermissions';
import { lockPagePermissionsToBountyCreator } from './lockPagePermissionsToBountyCreator';
import { updatePagePermissionDiscoverability } from './updatePagePermissionDiscoverability';
import { upsertPagePermission } from './upsertPagePermission';

export class PagePermissionsClient implements PagePermissionsClientInterface {
  // @ts-ignore
  computePagePermissions = computePagePermissions;

  bulkComputePagePermissions = bulkComputePagePermissions;

  getAccessiblePageIds = getAccessiblePageIds;

  // Premium methods
  upsertPagePermission = upsertPagePermission;

  updatePagePermissionDiscoverability = updatePagePermissionDiscoverability;

  deletePagePermission = deletePagePermission;

  listPagePermissions = listPagePermissions;

  setupPagePermissionsAfterEvent = handlePageEvent;

  isBountyPageEditableByApplicants = isBountyPageEditableByApplicants;

  lockPagePermissionsToBountyCreator = lockPagePermissionsToBountyCreator;
}
