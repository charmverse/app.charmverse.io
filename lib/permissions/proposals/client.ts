import type { BaseProposalPermissionsClient } from '@charmverse/core/permissions';

import { getProposalReviewerPool } from 'lib/proposal/getProposalReviewerPool';

import { computeProposalCategoryPermissions } from './computeProposalCategoryPermissions';
import { computeProposalFlowPermissions } from './computeProposalFlowPermissions';
import { getAccessibleProposalCategories } from './getAccessibleProposalCategories';

export class PublicProposalsPermissionsClient implements BaseProposalPermissionsClient {
  getProposalReviewerPool = getProposalReviewerPool;

  computeProposalFlowPermissions = computeProposalFlowPermissions;

  computeProposalCategoryPermissions = computeProposalCategoryPermissions;

  getAccessibleProposalCategories = getAccessibleProposalCategories;
}
