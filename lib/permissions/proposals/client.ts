import type { BaseProposalPermissionsClient, ProposalReviewerPool, Resource } from '@charmverse/core/permissions';

import { getProposalReviewerPool } from 'lib/proposal/getProposalReviewerPool';

import { computeProposalCategoryPermissions } from './computeProposalCategoryPermissions';
import { computeProposalFlowPermissions } from './computeProposalFlowPermissions';
import { computeProposalPermissions } from './computeProposalPermissions';
import { getAccessibleProposalCategories } from './getAccessibleProposalCategories';
import { getAccessibleProposals } from './getAccessibleProposals';

export class PublicProposalsPermissionsClient implements BaseProposalPermissionsClient {
  getProposalReviewerPool = getProposalReviewerPool;

  computeProposalFlowPermissions = computeProposalFlowPermissions;

  computeProposalPermissions = computeProposalPermissions;

  computeProposalCategoryPermissions = computeProposalCategoryPermissions;

  getAccessibleProposalCategories = getAccessibleProposalCategories;

  getAccessibleProposals = getAccessibleProposals;
}
