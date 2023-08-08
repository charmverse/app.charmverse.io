import type { ProposalFlowPermissionFlags } from '@charmverse/core/permissions';
import type { ProposalStatus } from '@charmverse/core/prisma';
import type { ProposalWithUsers } from '@charmverse/core/proposals';

export type StepperProps = {
  proposalStatus?: ProposalWithUsers['status'];
  archived?: boolean | null;
  openVoteModal?: () => void;
  updateProposalStatus?: (newStatus: ProposalStatus) => Promise<void>;
  proposalFlowPermissions?: ProposalFlowPermissionFlags;
};
export const stepperSize = 25;
