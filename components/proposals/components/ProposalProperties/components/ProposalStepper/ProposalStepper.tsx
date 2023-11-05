import { DesktopStepper } from './DesktopStepper';
import type { StepperProps } from './interfaces';
import { MobileStepper } from './MobileStepper';

export function ProposalStepper(props: StepperProps) {
  return (
    <>
      <DesktopStepper {...props} />
      <MobileStepper {...props} />
    </>
  );
}
