import { DELETE, GET, POST, PUT } from '../../../http';
import type {
  PageMetaWithPermissions,
  PagesRequest,
  UpdatePagePermissionDiscoverabilityRequest
} from '../../../pages/interfaces';
import { chunk, asyncSeries } from '../../../utilities/array';
import { AbstractPermissionsApiClient } from '../../clients/abstractApiClient.class';
import type { PermissionCompute, PermissionResource, Resource } from '../../core/interfaces';
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
  private get prefix() {
    return `${this.baseUrl}/api/pages`;
  }

  computePagePermissions(request: PermissionCompute): Promise<PagePermissionFlags> {
    return GET(`${this.prefix}/compute-page-permissions`, request);
  }

  async bulkComputePagePermissions(request: BulkPagePermissionCompute): Promise<BulkPagePermissionFlags> {
    const pageIds = request.pageIds ?? [];

    const chunkedPageIds = chunk(pageIds, this.getRequestBatchSize).map(
      (pageIdChunk) => ({ pageIds: pageIdChunk, userId: request.userId }) as BulkPagePermissionCompute
    );

    const computedResult = await asyncSeries(chunkedPageIds, (chunkedRequest: BulkPagePermissionCompute) =>
      GET<BulkPagePermissionFlags>(`${this.prefix}/bulk-compute-page-permissions`, chunkedRequest, {
        addBracketsToArrayValues: false
      })
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
    return GET(`${this.prefix}/list-ids`, request);
  }

  upsertPagePermission(
    request: PagePermissionAssignment<AssignablePagePermissionGroups>
  ): Promise<AssignedPagePermission> {
    return POST(`${this.prefix}/upsert-page-permission`, request, { headers: this.jsonHeaders });
  }

  deletePagePermission(request: PermissionResource): Promise<void> {
    return DELETE(`${this.prefix}/delete-page-permission`, request, { headers: this.jsonHeaders });
  }

  listPagePermissions(request: Resource): Promise<AssignedPagePermission<AssignablePagePermissionGroups>[]> {
    return GET(`${this.prefix}/page-permissions-list`, request);
  }

  setupPagePermissionsAfterEvent(request: PageEventTriggeringPermissions): Promise<void> {
    return POST(`${this.prefix}/setup-page-permissions-after-event`, request, { headers: this.jsonHeaders });
  }

  lockPagePermissionsToBountyCreator(request: Resource): Promise<PageMetaWithPermissions> {
    return POST(`${this.prefix}/lock-page-permissions-to-bounty-creator`, request, { headers: this.jsonHeaders });
  }

  isBountyPageEditableByApplicants(request: Resource): Promise<{ editable: boolean }> {
    return GET(`${this.prefix}/is-bounty-page-editable-by-applicants`, request);
  }

  updatePagePermissionDiscoverability(request: UpdatePagePermissionDiscoverabilityRequest): Promise<void> {
    return PUT(`${this.prefix}/update-page-discoverability`, request, { headers: this.jsonHeaders });
  }
}
