import type {
  PageMetaWithPermissions,
  PagesRequest,
  UpdatePagePermissionDiscoverabilityRequest
} from '../../../pages/interfaces';
import { chunk, asyncSeries } from '../../../utilities/array';
import { AbstractPermissionsApiClient } from '../../clients/abstractApiClient.class';
import type { PermissionCompute, PermissionResource, Resource } from '../../core/interfaces';
import * as pagesController from '../../permissionsApi/controllers/pages';
import type {
  AssignablePagePermissionGroups,
  AssignedPagePermission,
  BulkPagePermissionCompute,
  BulkPagePermissionFlags,
  PageEventTriggeringPermissions,
  PagePermissionAssignment,
  PagePermissionFlags
} from '../interfaces';

import type { PagePermissionsClient } from './interfaces';

export class PagePermissionsHttpClient extends AbstractPermissionsApiClient implements PagePermissionsClient {
  computePagePermissions(request: PermissionCompute): Promise<PagePermissionFlags> {
    return pagesController.computePagePermissions(request);
  }

  async bulkComputePagePermissions(request: BulkPagePermissionCompute): Promise<BulkPagePermissionFlags> {
    const pageIds = request.pageIds ?? [];

    const chunkedPageIds = chunk(pageIds, this.getRequestBatchSize).map(
      (pageIdChunk) => ({ pageIds: pageIdChunk, userId: request.userId }) as BulkPagePermissionCompute
    );

    const computedResult = await asyncSeries(chunkedPageIds, (chunkedRequest: BulkPagePermissionCompute) =>
      pagesController.bulkComputePagePermissions(chunkedRequest)
    ).then((results) => {
      const mergedResults: BulkPagePermissionFlags = {};

      for (const computedPagePermissions of results) {
        Object.assign(mergedResults, computedPagePermissions);
      }

      return mergedResults;
    });

    return computedResult;
  }

  getAccessiblePageIds(request: PagesRequest): Promise<string[]> {
    return pagesController.listIds(request);
  }

  upsertPagePermission(
    request: PagePermissionAssignment<AssignablePagePermissionGroups>
  ): Promise<AssignedPagePermission> {
    return pagesController.upsertPagePermission(request);
  }

  deletePagePermission(request: PermissionResource): Promise<void> {
    return pagesController.deletePagePermission(request);
  }

  listPagePermissions(request: Resource): Promise<AssignedPagePermission<AssignablePagePermissionGroups>[]> {
    return pagesController.pagePermissionsList(request);
  }

  setupPagePermissionsAfterEvent(request: PageEventTriggeringPermissions): Promise<void> {
    return pagesController.setupPagePermissionsAfterEvent(request);
  }

  lockPagePermissionsToBountyCreator(request: Resource): Promise<PageMetaWithPermissions> {
    return pagesController.lockPagePermissionsToBountyCreator(request);
  }

  isBountyPageEditableByApplicants(request: Resource): Promise<{ editable: boolean }> {
    return pagesController.isBountyPageEditableByApplicants(request);
  }

  updatePagePermissionDiscoverability(request: UpdatePagePermissionDiscoverabilityRequest): Promise<void> {
    return pagesController.updatePageDiscoverability(request);
  }
}
