import type { PremiumProposalPermissionsClient } from '@packages/core/permissions';

import { bulkComputeProposalPermissions } from './bulkComputeProposalPermissions';
import { computeAllProposalEvaluationPermissions } from './computeAllProposalEvaluationPermissions';
import { computeProposalEvaluationPermissions } from './computeProposalEvaluationPermissions';
import { getAccessibleProposalIdsUsingEvaluation } from './getAccessibleProposalIdsUsingEvaluation';

export class ProposalPermissionsClient implements PremiumProposalPermissionsClient {
  getAccessibleProposalIds = getAccessibleProposalIdsUsingEvaluation;

  computeProposalPermissions =
    computeProposalEvaluationPermissions as PremiumProposalPermissionsClient['computeProposalPermissions'];

  computeBaseProposalPermissions =
    computeProposalEvaluationPermissions as PremiumProposalPermissionsClient['computeBaseProposalPermissions'];

  computeAllProposalEvaluationPermissions = computeAllProposalEvaluationPermissions;

  bulkComputeProposalPermissions = bulkComputeProposalPermissions;
}
