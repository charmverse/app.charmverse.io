import type { ProposalFlowPermissionFlags } from '@charmverse/core/permissions';
import type { ProposalStatus, ProposalEvaluationType } from '@charmverse/core/prisma';
import type { ProposalWithUsers } from '@charmverse/core/proposals';

export type StepperProps = {
  proposalStatus?: ProposalWithUsers['status'];
  archived?: boolean | null;
  handleProposalStatusUpdate: (newStatus: ProposalStatus) => Promise<void>;
  proposalFlowPermissions?: ProposalFlowPermissionFlags;
  evaluationType?: ProposalEvaluationType;
};
export const stepperSize = 25;
