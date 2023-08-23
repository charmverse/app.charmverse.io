import type { ProposalFlowPermissionFlags } from '@charmverse/core/permissions';
import type { ProposalStatus, ProposalEvaluationType } from '@charmverse/core/prisma';
import type { ProposalWithUsers } from '@charmverse/core/proposals';

import type { PageWithContent } from 'lib/pages';

export type StepperProps = {
  proposalStatus?: ProposalWithUsers['status'];
  archived?: boolean | null;
  openVoteModal?: () => void;
  updateProposalStatus?: (newStatus: ProposalStatus) => Promise<void>;
  proposalFlowPermissions?: ProposalFlowPermissionFlags;
  evaluationType?: ProposalEvaluationType;
  proposalPage?: PageWithContent;
};
export const stepperSize = 25;
