import type { ProposalStatus } from '@charmverse/core/dist/prisma';

import type { ProposalFlowFlags } from 'lib/proposal/computeProposalFlowFlags';
import type { ProposalWithUsers } from 'lib/proposal/interface';

export type StepperProps = {
  proposal?: ProposalWithUsers;
  openVoteModal: () => void;
  updateProposalStatus: (newStatus: ProposalStatus) => Promise<void>;
  proposalFlowPermissions?: ProposalFlowFlags;
};
export const stepperSize = 25;
