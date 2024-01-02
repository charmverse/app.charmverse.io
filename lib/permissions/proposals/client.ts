import type { BaseProposalPermissionsClient } from '@charmverse/core/permissions';

import { getProposalReviewerPool } from 'lib/proposal/getProposalReviewerPool';

export class PublicProposalsPermissionsClient implements BaseProposalPermissionsClient {
  getProposalReviewerPool = getProposalReviewerPool;
}
