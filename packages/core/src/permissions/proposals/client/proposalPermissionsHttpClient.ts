import type { ListProposalsRequest } from '../../../proposals/interfaces';
import { AbstractPermissionsApiClient } from '../../clients/abstractApiClient.class';
import type { PermissionCompute, SpaceResourcesRequest } from '../../core/interfaces';
import * as proposalController from '../../permissionsApi/controllers/proposals';
import type { ProposalPermissionFlags, SmallProposalPermissionFlags } from '../interfaces';

import type { PremiumProposalPermissionsClient } from './interfaces';

export class ProposalPermissionsHttpClient
  extends AbstractPermissionsApiClient
  implements PremiumProposalPermissionsClient
{
  getAccessibleProposalIds(request: ListProposalsRequest): Promise<string[]> {
    return proposalController.listIds(request);
  }

  computeProposalPermissions(request: PermissionCompute): Promise<ProposalPermissionFlags> {
    return proposalController.computeProposalPermissions(request);
  }

  computeAllProposalEvaluationPermissions(
    request: PermissionCompute
  ): Promise<Record<string, ProposalPermissionFlags>> {
    return proposalController.computeAllProposalEvaluationPermissions(request);
  }

  computeBaseProposalPermissions(request: PermissionCompute): Promise<ProposalPermissionFlags> {
    return proposalController.computeBaseProposalPermissions(request);
  }

  bulkComputeProposalPermissions({
    spaceId,
    userId
  }: SpaceResourcesRequest): Promise<Record<string, SmallProposalPermissionFlags>> {
    return proposalController.bulkComputeProposalPermissions({ spaceId, userId });
  }
}
