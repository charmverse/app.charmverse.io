import type { ListProposalsRequest } from '../../../proposals/interfaces';
import type { PermissionCompute, SpaceResourcesRequest } from '../../core/interfaces';
import type { ProposalPermissionFlags, SmallProposalPermissionFlags } from '../interfaces';

export type BaseProposalPermissionsClient = {};
export type PremiumProposalPermissionsClient = BaseProposalPermissionsClient & {
  computeProposalPermissions: (request: PermissionCompute) => Promise<ProposalPermissionFlags>;

  /**
   * A method for getting the users' permissions on each step of the workflow
   * Each key in the result is permissions for that evaluationId
   */
  computeAllProposalEvaluationPermissions: (
    request: PermissionCompute
  ) => Promise<Record<string, ProposalPermissionFlags>>;

  // This will be the new method used for proposals with evaluation step
  getAccessibleProposalIds: (request: ListProposalsRequest) => Promise<string[]>;
  computeBaseProposalPermissions: (request: PermissionCompute) => Promise<ProposalPermissionFlags>;

  bulkComputeProposalPermissions: (req: SpaceResourcesRequest) => Promise<Record<string, SmallProposalPermissionFlags>>;
};
