import type { ProposalFlowPermissionFlags } from '@charmverse/core';
import type { ProposalStatus } from '@charmverse/core/prisma';

import type { ProposalWithUsers } from 'lib/proposal/interface';

export type StepperProps = {
  proposal?: ProposalWithUsers;
  openVoteModal: () => void;
  updateProposalStatus: (newStatus: ProposalStatus) => Promise<void>;
  proposalFlowPermissions?: ProposalFlowPermissionFlags;
};
export const stepperSize = 25;
