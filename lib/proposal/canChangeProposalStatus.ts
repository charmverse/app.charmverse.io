import type { ProposalStatus } from '@charmverse/core/dist/prisma';

import type { ProposalWithUsers } from 'lib/proposal/interface';
import type { ProposalUserGroup } from 'lib/proposal/proposalStatusTransition';
import { proposalStatusTransitionPermission } from 'lib/proposal/proposalStatusTransition';

type Props = {
  proposal?: ProposalWithUsers;
  proposalUserGroups: ProposalUserGroup[];
  updatedStatus: ProposalStatus;
};

export function canChangeProposalStatus({ proposal, proposalUserGroups, updatedStatus }: Props) {
  const currentStatus = proposal?.status;
  const reviewers = proposal?.reviewers ?? [];

  return currentStatus
    ? (currentStatus === 'discussion' && updatedStatus === 'review' ? reviewers.length !== 0 : true) &&
        proposalUserGroups.some((proposalUserGroup) =>
          proposalStatusTransitionPermission[currentStatus]?.[proposalUserGroup]?.includes(updatedStatus)
        )
    : false;
}
