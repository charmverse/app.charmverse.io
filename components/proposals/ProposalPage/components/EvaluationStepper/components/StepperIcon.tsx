import type { ProposalEvaluationResult } from '@charmverse/core/prisma';
import styled from '@emotion/styled';
import { Stack } from '@mui/material';

const stepperSize = 25;

export const StepperStack = styled(Stack)<{
  isCurrent: boolean;
  result: ProposalEvaluationResult | null;
  isSelected: boolean;
  isDisabled: boolean;
}>(({ theme, isSelected, result, isCurrent, isDisabled }) => {
  const currentColor = isCurrent
    ? result === 'pass'
      ? theme.palette.success.main
      : result === 'fail'
      ? theme.palette.error.main
      : theme.palette.primary.main
    : theme.palette.gray.main;

  const isPastOrPresent = result || isCurrent;
  return `

    cursor: ${isDisabled ? 'default' : 'pointer'};

    .stepper-icon {
      width: ${stepperSize}px;
      height: ${stepperSize}px;
      background-color: ${isPastOrPresent ? currentColor : 'transparent'};
      border: 1px solid ${currentColor};
      box-sizing: border-box;
      color: ${isCurrent ? 'white' : theme.palette.text.primary};
      transition: background-color 150ms ease-in-out;
      justify-content: center;
      align-items: center;
      display: flex;
      border-radius: 100%;
      position: relative;

      &::before {
        border-radius: 100%;
        content: '';
        display: block;
        position: absolute;
        height: 100%;
        width: 100%;
        box-shadow: 0 0 0 2px ${theme.palette.background.default}, 0 0 0 5px ${currentColor};
        opacity: ${isSelected ? 1 : 0};
        transition: opacity 150ms ease-in-out;
      }
    }

    ${
      !isDisabled &&
      `
    // disable hover UX on ios which converts first click to a hover event
    @media (pointer: fine) {
      &:hover {
        .stepper-icon {
        }
        .stepper-icon::before {
          opacity: 1;
        }
      }
    }`
    }
`;
});
