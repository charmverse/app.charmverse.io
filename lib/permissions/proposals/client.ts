import type { BaseProposalPermissionsClient } from '@charmverse/core/permissions';

import { getProposalReviewerPool } from 'lib/proposal/getProposalReviewerPool';

import { computeProposalFlowPermissions } from './computeProposalFlowPermissions';

export class PublicProposalsPermissionsClient implements BaseProposalPermissionsClient {
  getProposalReviewerPool = getProposalReviewerPool;

  computeProposalFlowPermissions = computeProposalFlowPermissions;
}
