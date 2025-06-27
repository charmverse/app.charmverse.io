import type {
  PageMetaWithPermissions,
  PagesRequest,
  UpdatePagePermissionDiscoverabilityRequest
} from '../../../pages/interfaces';
import type { PermissionCompute, PermissionResource, Resource } from '../../core/interfaces';
import type {
  AssignedPagePermission,
  BulkPagePermissionCompute,
  BulkPagePermissionFlags,
  PageEventTriggeringPermissions,
  PagePermissionAssignment,
  PagePermissionFlags
} from '../interfaces';

export type PagePermissionsClient = {
  computePagePermissions: (request: PermissionCompute) => Promise<PagePermissionFlags>;
  bulkComputePagePermissions: (request: BulkPagePermissionCompute) => Promise<BulkPagePermissionFlags>;
  upsertPagePermission: (request: PagePermissionAssignment) => Promise<AssignedPagePermission>;
  getAccessiblePageIds: (request: PagesRequest) => Promise<string[]>;
  deletePagePermission: (request: PermissionResource) => Promise<void>;
  listPagePermissions: (request: Resource) => Promise<AssignedPagePermission[]>;
  lockPagePermissionsToBountyCreator: (request: Resource) => Promise<PageMetaWithPermissions>;
  setupPagePermissionsAfterEvent: (request: PageEventTriggeringPermissions) => Promise<void>;
  isBountyPageEditableByApplicants: (request: Resource) => Promise<{ editable: boolean }>;
  updatePagePermissionDiscoverability: (request: UpdatePagePermissionDiscoverabilityRequest) => Promise<void>;
};
