import { uniqBy } from 'lodash';

import { getAccessibleProposalCategories } from 'lib/permissions/proposals/getAccessibleProposalCategories';

import type { ListProposalsRequest } from './getProposalsBySpace';
import { getProposalsBySpace, getUserProposalsBySpace } from './getProposalsBySpace';
import type { ProposalWithCommentsAndUsers, ProposalWithUsers } from './interface';

export async function getAccessibleProposals({
  spaceId,
  userId,
  categoryIds,
  includePage
}: {
  includePage?: boolean;
  userId: string;
  spaceId: string;
  categoryIds?: ListProposalsRequest['categoryIds'];
}): Promise<(ProposalWithUsers | ProposalWithCommentsAndUsers)[]> {
  const accessibleCategories = await getAccessibleProposalCategories({
    userId,
    spaceId
  });

  const viewableProposals = await getProposalsBySpace({
    spaceId,
    categoryIds: accessibleCategories.map((c) => c.id),
    userId,
    includePage
  });

  const userProposals = await getUserProposalsBySpace({
    spaceId,
    userId,
    categoryIds,
    includePage
  });

  // Dedupe proposals
  return uniqBy([...viewableProposals, ...userProposals], 'id');
}
