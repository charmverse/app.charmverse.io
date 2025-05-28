import { styled } from '@mui/material';
import type { AccordionProps } from '@mui/material';
import { AccordionDetails, AccordionSummary, Box, Accordion as MuiAccordion, Typography } from '@mui/material';
import type { ReactNode } from 'react';

import type { Result } from './StepperResultIcon';
import { StepperResultIcon } from './StepperResultIcon';

type Props = {
  title: string;
  result: Result | null;
  index: number;
  isCurrent?: boolean;
  expanded?: boolean;
  expandedContainer?: boolean;
  onChange?: (e: any, expanded: boolean) => void;
  actions?: ReactNode;
  children?: ReactNode;
  showDash?: boolean;
  isAppealActive?: boolean;
};

const Accordion = styled((props: AccordionProps) => <MuiAccordion disableGutters elevation={0} square {...props} />)(
  ({ theme }) => `
    border: 0;
    border-top: 1px solid ${theme.palette.divider};
    &:before {
      display: none;
    }
    ${theme.breakpoints.up('sm')} {
      .show-on-hover {
        opacity: 0;
        transition: opacity 0.2s ease-in-out;
      }
      &:hover {
        .show-on-hover {
          opacity: 1;
        }
      }
    }

  `
);

export function EvaluationStepRow({
  expanded,
  expandedContainer = true,
  onChange,
  isCurrent,
  result,
  index,
  title,
  children,
  actions,
  showDash,
  isAppealActive
}: Props) {
  return (
    <Accordion expanded={expanded} onChange={onChange}>
      <AccordionSummary sx={{ px: 1 }}>
        <Box display='flex' alignItems='center' gap={1} width='100%'>
          <StepperResultIcon
            isAppealActive={isAppealActive}
            result={result}
            isCurrent={isCurrent}
            showDash={showDash}
            position={index + 1}
          />
          {expandedContainer && (
            <>
              <Typography variant='h6' sx={{ flexGrow: 1 }}>
                {title}
              </Typography>
              {actions}
            </>
          )}
        </Box>
      </AccordionSummary>
      {children && <AccordionDetails sx={{ px: 1 }}>{children}</AccordionDetails>}
    </Accordion>
  );
}
