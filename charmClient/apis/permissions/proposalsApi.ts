import type { ProposalPermissionFlags } from '@charmverse/core/permissions';

import * as http from 'adapters/http';
import type { PermissionCompute } from 'lib/permissions/interfaces';

export class ProposalPermissionsApi {
  computeProposalPermissions({ proposalIdOrPath, spaceDomain }: { proposalIdOrPath: string; spaceDomain?: string }) {
    return http.POST<ProposalPermissionFlags>(`/api/permissions/proposals/compute-proposal-permissions`, {
      resourceId: !spaceDomain ? proposalIdOrPath : `${spaceDomain}/${proposalIdOrPath}`
    } as PermissionCompute);
  }
}
