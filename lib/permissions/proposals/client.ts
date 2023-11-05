import type { BaseProposalPermissionsClient } from '@charmverse/core/permissions';

import { getProposalReviewerPool } from 'lib/proposal/getProposalReviewerPool';

import { computeProposalCategoryPermissions } from './computeProposalCategoryPermissions';
import { computeProposalFlowPermissions } from './computeProposalFlowPermissions';
import { computeProposalPermissions } from './computeProposalPermissions';
import { getAccessibleProposalCategories } from './getAccessibleProposalCategories';
import { getAccessibleProposalIds } from './getAccessibleProposalIds';
import { getAccessibleProposals } from './getAccessibleProposals';

export class PublicProposalsPermissionsClient implements BaseProposalPermissionsClient {
  getProposalReviewerPool = getProposalReviewerPool;

  computeProposalFlowPermissions = computeProposalFlowPermissions;

  computeProposalPermissions = computeProposalPermissions;

  computeProposalCategoryPermissions = computeProposalCategoryPermissions;

  getAccessibleProposalCategories = getAccessibleProposalCategories;

  getAccessibleProposals = getAccessibleProposals;

  getAccessibleProposalIds = getAccessibleProposalIds;
}
