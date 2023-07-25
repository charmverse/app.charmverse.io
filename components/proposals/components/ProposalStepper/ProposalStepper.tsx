import { DesktopStepper } from './DesktopStepper';
import type { StepperProps } from './interfaces';
import { MobileStepper } from './MobileStepper';

export function ProposalStepper({
  proposalStatus,
  openVoteModal,
  updateProposalStatus,
  proposalFlowPermissions,
  archived
}: StepperProps) {
  return (
    <>
      <DesktopStepper
        proposalStatus={proposalStatus}
        openVoteModal={openVoteModal}
        updateProposalStatus={updateProposalStatus}
        proposalFlowPermissions={proposalFlowPermissions}
        archived={archived}
      />
      <MobileStepper
        proposalStatus={proposalStatus}
        openVoteModal={openVoteModal}
        updateProposalStatus={updateProposalStatus}
        proposalFlowPermissions={proposalFlowPermissions}
        archived={archived}
      />
    </>
  );
}
