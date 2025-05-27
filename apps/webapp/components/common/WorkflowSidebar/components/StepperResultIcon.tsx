import { styled } from '@mui/material';
import { Check as CheckIcon, Close as CloseIcon } from '@mui/icons-material';
import { Typography } from '@mui/material';

const stepperSize = 25;

const StyledIconContainer = styled.div<{
  isCurrent?: boolean;
  isAppealActive?: boolean;
  result: 'pass' | 'fail' | null;
}>(({ theme, result, isCurrent, isAppealActive }) => {
  const currentColor = isCurrent
    ? result === 'pass'
      ? theme.palette.success.main
      : result === 'fail'
        ? theme.palette.error.main
        : isAppealActive
          ? theme.palette.warning.main
          : theme.palette.primary.main
    : theme.palette.gray.main;

  const isPastOrPresent = result || isCurrent;
  return `
    width: ${stepperSize}px;
    height: ${stepperSize}px;
    background-color: ${isPastOrPresent ? currentColor : 'transparent'};
    border: 1px solid ${currentColor};
    box-sizing: border-box;
    color: ${isCurrent ? (isAppealActive ? theme.palette.warning.contrastText : 'white') : theme.palette.text.primary};
    transition: background-color 150ms ease-in-out;
    justify-content: center;
    align-items: center;
    display: flex;
    border-radius: 100%;
    position: relative;
`;
});

export type Result = 'pass' | 'fail';

export function StepperResultIcon({
  result,
  isCurrent,
  position,
  showDash,
  isAppealActive
}: {
  isAppealActive?: boolean;
  isCurrent?: boolean;
  result: Result | null;
  position: number;
  // Show dash if an intermediate step was skipped (when final step is on a step before the current one)
  showDash?: boolean;
}) {
  return (
    <StyledIconContainer isAppealActive={isAppealActive} result={result} isCurrent={isCurrent}>
      {result === 'pass' ? (
        <CheckIcon fontSize='small' data-test={`evaluation-passed-icon-${position}`} />
      ) : result === 'fail' ? (
        <CloseIcon fontSize='small' />
      ) : (
        <Typography fontWeight={500}>{showDash ? '-' : `${position}`}</Typography>
      )}
    </StyledIconContainer>
  );
}
