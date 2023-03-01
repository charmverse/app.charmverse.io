import { DesktopStepper } from './DesktopStepper';
import type { StepperProps } from './interfaces';
import { MobileStepper } from './MobileStepper';

export function ProposalStepper({
  proposal,
  openVoteModal,
  updateProposalStatus,
  proposalFlowPermissions
}: StepperProps) {
  return (
    <>
      <DesktopStepper
        proposal={proposal}
        openVoteModal={openVoteModal}
        updateProposalStatus={updateProposalStatus}
        proposalFlowPermissions={proposalFlowPermissions}
      />
      <MobileStepper
        proposal={proposal}
        openVoteModal={openVoteModal}
        updateProposalStatus={updateProposalStatus}
        proposalFlowPermissions={proposalFlowPermissions}
      />
    </>
  );
}
