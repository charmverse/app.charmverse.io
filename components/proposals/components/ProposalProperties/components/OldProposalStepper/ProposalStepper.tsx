import { DesktopStepper } from './DesktopStepper';
import type { StepperProps } from './interfaces';
import { MobileStepper } from './MobileStepper';

export function OldProposalStepper(props: StepperProps) {
  return (
    <>
      <DesktopStepper {...props} />
      <MobileStepper {...props} />
    </>
  );
}
