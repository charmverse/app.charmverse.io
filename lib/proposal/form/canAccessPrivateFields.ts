import { hasAccessToSpace, isProposalAuthor } from '@charmverse/core/permissions';
import type { Proposal, User } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';

import { getPermissionsClient } from 'lib/permissions/api';

export async function canAccessPrivateFields({
  proposalId,
  userId,
  proposal
}: {
  proposalId: string;
  userId: string;
  proposal?: Proposal & {
    authors: {
      proposalId: string;
      userId: string;
    }[];
  };
}) {
  const checkProposal =
    proposal || (await prisma.proposal.findUnique({ where: { id: proposalId }, include: { authors: true } }));

  if (!checkProposal) {
    return false;
  }

  // authors can view private fields
  const isAuthor = isProposalAuthor({ proposal: checkProposal, userId });
  if (isAuthor) {
    return true;
  }

  // admins can view private fields
  const { isAdmin } = await hasAccessToSpace({ spaceId: checkProposal.spaceId, userId });
  if (isAdmin) {
    return true;
  }

  const permissions = await getPermissionsClient({ resourceId: proposalId, resourceIdType: 'proposal' }).then(
    ({ client }) =>
      client.proposals.computeProposalPermissions({
        resourceId: proposalId,
        useProposalEvaluationPermissions: checkProposal.status === 'published',
        userId
      })
  );

  // reviewers can view private fields
  return permissions.review || permissions.evaluate;
}
