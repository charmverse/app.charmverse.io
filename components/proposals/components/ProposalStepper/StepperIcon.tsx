import styled from '@emotion/styled';

import { stepperSize } from './interfaces';

export const StepperIcon = styled.div<{ isCurrent: boolean; isComplete: boolean; isEnabled: boolean }>(
  ({ theme, isComplete, isCurrent, isEnabled }) => `
  width: ${stepperSize}px;
  height: ${stepperSize}px;
  background-color: ${
    isComplete ? theme.palette.purple.main : isCurrent || isEnabled ? theme.palette.teal.main : theme.palette.gray.main
  };
  transition: background-color 150ms ease-in-out;
  justify-content: center;
  align-items: center;
  display: flex;
  border-radius: 100%;
  cursor: ${isEnabled ? 'pointer' : 'default'};
  position: relative;

  &::before {
    border-radius: 100%;
    content: '';
    display: block;
    position: absolute;
    height: 100%;
    width: 100%;
    box-shadow: 0 0 0 2px ${theme.palette.background.default}, 0 0 0 5px ${theme.palette.teal.main};
    opacity: 0;
    transition: opacity 150ms ease-in-out;
  }

  ${
    isCurrent
      ? `
    &::before {
      box-shadow: 0 0 0 2px ${theme.palette.background.default}, 0 0 0 5px ${theme.palette.teal.main};
      opacity: 1;
    }
  `
      : ''
  }

  ${
    !isCurrent && isEnabled
      ? `
    // disable hover UX on ios which converts first click to a hover event
    @media (pointer: fine) {

      &:hover {
        background-color: ${theme.palette.teal.dark};
        &::before  {
          box-shadow: 0 0 0 2px ${theme.palette.background.default}, 0 0 0 5px ${theme.palette.teal.dark};
          opacity: 1;
        }
      }
    }
  `
      : ''
  }
`
);
