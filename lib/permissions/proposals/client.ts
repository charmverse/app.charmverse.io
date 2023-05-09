import type { BaseProposalPermissionsClient } from '@charmverse/core';

import { computeProposalCategoryPermissions } from './computeProposalCategoryPermissions';
import { computeProposalPermissions } from './computeProposalPermissions';
import { getAccessibleProposalCategories } from './getAccessibleProposalCategories';
import { getAccessibleProposals } from './getAccessibleProposals';

export class PublicProposalsPermissionsClient implements BaseProposalPermissionsClient {
  computeProposalPermissions = computeProposalPermissions;

  computeProposalCategoryPermissions = computeProposalCategoryPermissions;

  getAccessibleProposalCategories = getAccessibleProposalCategories;

  getAccessibleProposals = getAccessibleProposals;
}
