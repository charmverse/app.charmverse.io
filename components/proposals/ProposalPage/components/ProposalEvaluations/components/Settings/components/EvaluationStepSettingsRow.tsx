import styled from '@emotion/styled';
import type { AccordionProps } from '@mui/material';
import { AccordionDetails, AccordionSummary, Box, Accordion as MuiAccordion, Typography } from '@mui/material';
import type { ReactNode } from 'react';

import { StepperResultIcon } from 'components/common/WorkflowSidebar/components/StepperResultIcon';

type Props = {
  title: string;
  index: number;
  expanded?: boolean;
  actions?: ReactNode;
  children?: ReactNode;
  expandedSidebar?: boolean;
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

export function EvaluationStepSettingsRow({ expandedSidebar, expanded, index, title, children, actions }: Props) {
  return (
    <Accordion defaultExpanded={expanded}>
      <AccordionSummary sx={{ px: 1 }}>
        <Box display='flex' alignItems='center' gap={1} width='100%'>
          <StepperResultIcon position={index + 1} result={null} />
          {expandedSidebar && (
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
