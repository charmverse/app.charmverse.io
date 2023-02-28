import * as http from 'adapters/http';
import type { PermissionCompute, PermissionToDelete } from 'lib/permissions/interfaces';
import type {
  AssignedProposalCategoryPermission,
  AvailableProposalCategoryPermissionFlags,
  AvailableProposalPermissionFlags
} from 'lib/permissions/proposals/interfaces';
import type { ProposalCategoryPermissionInput } from 'lib/permissions/proposals/upsertProposalCategoryPermission';

export class ProposalPermissionsApi {
  computeProposalPermissions({ proposalIdOrPath, spaceDomain }: { proposalIdOrPath: string; spaceDomain?: string }) {
    return http.POST<AvailableProposalPermissionFlags>(`/api/permissions/proposals/compute-proposal-permissions`, {
      resourceId: !spaceDomain ? proposalIdOrPath : `${spaceDomain}/${proposalIdOrPath}`
    } as PermissionCompute);
  }

  computeProposalCategoryPermissions(proposalCategoryId: string) {
    return http.POST<AvailableProposalCategoryPermissionFlags>(
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
    return http.DELETE('/api/permissions/proposals', { permissionId } as PermissionToDelete);
  }

  listProposalCategoryPermissions(proposalCategoryId: string) {
    return http.GET<AssignedProposalCategoryPermission[]>(
      '/api/permissions/proposals/list-proposal-category-permissions',
      {
        resourceId: proposalCategoryId
      } as PermissionCompute
    );
  }
}
