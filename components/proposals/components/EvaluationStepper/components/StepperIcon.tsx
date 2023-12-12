import styled from '@emotion/styled';
import { Stack } from '@mui/material';

const stepperSize = 25;

export const StepperStack = styled(Stack)<{ isCurrent: boolean; isComplete: boolean; isDisabled: boolean }>(
  ({ theme, isComplete, isCurrent, isDisabled }) => {
    const currentColor = isCurrent ? theme.palette.primary.main : theme.palette.gray.main;
    return `

    cursor: ${isDisabled ? 'default' : 'pointer'};

    .stepper-icon {
      width: ${stepperSize}px;
      height: ${stepperSize}px;
      background-color: ${currentColor};
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
        opacity: ${isCurrent ? 1 : 0};
        transition: opacity 150ms ease-in-out;
      }
    }

    ${
      !isDisabled &&
      `
    // disable hover UX on ios which converts first click to a hover event
    @media (pointer: fine) {
      &:hover {
        .stepper-icon::before  {
          box-shadow: 0 0 0 2px ${theme.palette.background.default}, 0 0 0 5px ${currentColor};
          opacity: 1;
        }
      }
    }`
    }
`;
  }
);
