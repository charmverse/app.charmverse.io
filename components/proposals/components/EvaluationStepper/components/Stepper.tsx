import { DesktopStepper } from './DesktopStepper';
import { MobileStepper } from './MobileStepper';

type Step = {
  label: string;
  description: string;
  completed: boolean;
  disabled: boolean;
  value: string;
};

export type StepperProps = {
  selected?: string; // the step you are looking at but not necessarily the one in process
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
