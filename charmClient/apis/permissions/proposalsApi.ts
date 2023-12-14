import type {
  AssignedProposalCategoryPermission,
  ProposalCategoryPermissionFlags,
  ProposalPermissionFlags
} from '@charmverse/core/permissions';

import * as http from 'adapters/http';
import type { PermissionCompute, PermissionResource } from 'lib/permissions/interfaces';
import type { ProposalCategoryPermissionInput } from 'lib/permissions/proposals/upsertProposalCategoryPermission';

export class ProposalPermissionsApi {
  computeProposalCategoryPermissions(proposalCategoryId: string) {
    return http.POST<ProposalCategoryPermissionFlags>(
      `/api/permissions/proposals/compute-proposal-category-permissions`,
      {
        resourceId: proposalCategoryId
      } as PermissionCompute
    );
  }

  upsertProposalCategoryPermission(permissionInput: ProposalCategoryPermissionInput) {
    return http.POST<AssignedProposalCategoryPermission>('/api/permissions/proposals', permissionInput);
  }

  deleteProposalCategoryPermission(permissionId: string) {
    return http.DELETE('/api/permissions/proposals', { permissionId } as PermissionResource);
  }

  listProposalCategoryPermissions(resourceId: string) {
    return http.GET<AssignedProposalCategoryPermission[]>(
      '/api/permissions/proposals/list-proposal-category-permissions',
      { resourceId }
    );
  }
}
