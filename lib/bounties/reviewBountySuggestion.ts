import { prisma } from 'db';
import type { BountyWithDetails } from 'lib/bounties';
import { includePagePermissions } from 'lib/pages/server';
import { WrongStateError } from 'lib/utilities/errors';

import { getBountyOrThrow } from './getBounty';
import type { SuggestionAction, SuggestionApproveAction, SuggestionRejectAction } from './interfaces';

/**
 * Returns true if we reject bounty (and it's deleted)
 * Returns newly accepted bounty
 * @param param0
 */
export async function reviewBountySuggestion ({ bountyId, decision }: SuggestionApproveAction): Promise<BountyWithDetails>
export async function reviewBountySuggestion ({ bountyId, decision }: SuggestionRejectAction): Promise<true>
export async function reviewBountySuggestion ({ bountyId, decision }: SuggestionAction): Promise<BountyWithDetails | true> {
  const bounty = await getBountyOrThrow(bountyId);

  if (bounty.status !== 'suggestion') {
    throw new WrongStateError(`This is bounty has the "${bounty.status}" status. It is not a deleteable suggestion.`);
  }

  if (decision === 'reject') {
    await prisma.bounty.delete({
      where: {
        id: bountyId
      }
    });
    return true;
  }

  // All other checks passed, Let's change this bounty's status from "suggestion" to "open"
  return prisma.bounty.update({
    where: {
      id: bountyId
    },
    data: {
      status: 'open'
    },
    include: {
      applications: true,
      page: {
        include: includePagePermissions()
      }
    }
  }) as Promise<BountyWithDetails>;
}
