import type { BaseProposalPermissionsClient } from '@charmverse/core';

import { computeProposalCategoryPermissions } from './computeProposalCategoryPermissions';
import { computeProposalFlowPermissions } from './computeProposalFlowPermissions';
import { computeProposalPermissions } from './computeProposalPermissions';
import { getAccessibleProposalCategories } from './getAccessibleProposalCategories';
import { getAccessibleProposals } from './getAccessibleProposals';

export class PublicProposalsPermissionsClient implements BaseProposalPermissionsClient {
  computeProposalFlowPermissions = computeProposalFlowPermissions;

  computeProposalPermissions = computeProposalPermissions;

  computeProposalCategoryPermissions = computeProposalCategoryPermissions;

  getAccessibleProposalCategories = getAccessibleProposalCategories;

  getAccessibleProposals = getAccessibleProposals;
}
