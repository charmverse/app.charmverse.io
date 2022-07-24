import { prisma } from 'db';
import { DataNotFoundError, WrongStateError } from 'lib/utilities/errors';
import { BountyWithDetails } from 'models';
import { getBounty } from './getBounty';
import { SuggestionAction, SuggestionApproveAction, SuggestionRejectAction } from './interfaces';

/**
 * Returns true if we reject bounty (and it's deleted)
 * Returns newly accepted bounty
 * @param param0
 */
export async function reviewBountySuggestion ({ bountyId, decision }: SuggestionApproveAction): Promise<BountyWithDetails>
export async function reviewBountySuggestion ({ bountyId, decision }: SuggestionRejectAction): Promise<true>
export async function reviewBountySuggestion ({ bountyId, decision }: SuggestionAction): Promise<BountyWithDetails | true> {
  const bounty = await getBounty(bountyId);

  if (!bounty) {
    throw new DataNotFoundError(`Bounty with id ${bountyId} not found`);
  }

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
  const bountyAfterApproval = await prisma.bounty.update({
    where: {
      id: bountyId
    },
    data: {
      status: 'open'
    },
    include: {
      applications: true,
      page: true
    }
  });

  return bountyAfterApproval;

}
