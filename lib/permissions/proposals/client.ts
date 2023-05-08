import type { BaseProposalPermissionsClient } from '@charmverse/core';

import { computeProposalCategoryPermissions } from './computeProposalCategoryPermissions';
import { computeProposalPermissions } from './computeProposalPermissions';
import { getProposalCategories } from './getProposalCategories';

export class PublicProposalsPermissionsClient implements BaseProposalPermissionsClient {
  computeProposalPermissions = computeProposalPermissions;

  computeProposalCategoryPermissions = computeProposalCategoryPermissions;

  getProposalCategories = getProposalCategories;
}
