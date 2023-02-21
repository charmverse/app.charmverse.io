import type { ProposalStatus } from '@prisma/client';

import type { ProposalWithUsers } from 'lib/proposal/interface';
import type { ProposalFlowFlags } from 'lib/proposal/state/transition';

export type StepperProps = {
  proposal?: ProposalWithUsers;
  openVoteModal: () => void;
  updateProposalStatus: (newStatus: ProposalStatus) => Promise<void>;
  proposalFlowPermissions?: ProposalFlowFlags;
};
export const stepperSize = 25;
