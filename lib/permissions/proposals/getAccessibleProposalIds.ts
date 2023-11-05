import type { ListProposalsRequest } from '@charmverse/core/proposals';

import { getAccessibleProposals } from './getAccessibleProposals';

export function getAccessibleProposalIds(req: ListProposalsRequest): Promise<string[]> {
  return getAccessibleProposals(req).then((proposals) => proposals.map((p) => p.id));
}
