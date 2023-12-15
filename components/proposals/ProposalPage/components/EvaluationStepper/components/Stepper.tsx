import type { ProposalEvaluationResult } from '@charmverse/core/prisma';

import { DesktopStepper } from './DesktopStepper';
import { MobileStepper } from './MobileStepper';

export type Step = {
  label: string;
  description: string;
  disabled: boolean;
  value: string;
  result: ProposalEvaluationResult | null;
};

export type StepperProps = {
  selected?: string | null; // the step you are looking at but not necessarily the one in process
  value?: string;
  onClick: (selectedValue: string) => void;
  steps: Step[];
};

// a generic stepper component that can be used for any purpose
export function Stepper(props: StepperProps) {
  return (
    <>
      <DesktopStepper {...props} />
      <MobileStepper {...props} />
    </>
  );
}
