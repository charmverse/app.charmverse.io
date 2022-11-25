import type { AvailableResourcesRequest } from 'lib/permissions/interfaces';

export interface AvailableResourcesWithPaginationRequest extends AvailableResourcesRequest {
  page?: number;
  count?: number;
  sort?: string;
}
