import type { ProposalEvaluationResult } from '@charmverse/core/prisma';
import styled from '@emotion/styled';
import { Close as CloseIcon, Check as CheckIcon } from '@mui/icons-material';
import { Stack, Typography } from '@mui/material';

const stepperSize = 25;

const StyledIconContainer = styled.div<{
  isCurrent?: boolean;
  result: ProposalEvaluationResult | null;
}>(({ theme, result, isCurrent }) => {
  const currentColor = isCurrent
    ? result === 'pass'
      ? theme.palette.success.main
      : result === 'fail'
      ? theme.palette.error.main
      : theme.palette.primary.main
    : theme.palette.gray.main;

  const isPastOrPresent = result || isCurrent;
  return `
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
`;
});

export function StepperIcon({
  result,
  isCurrent,
  position
}: {
  isCurrent?: boolean;
  result: ProposalEvaluationResult | null;
  position: number;
}) {
  return (
    <StyledIconContainer result={result} isCurrent={isCurrent}>
      {result === 'pass' ? (
        <CheckIcon fontSize='small' />
      ) : result === 'fail' ? (
        <CloseIcon fontSize='small' />
      ) : (
        <Typography fontWeight={500}>{position}</Typography>
      )}
    </StyledIconContainer>
  );
}
