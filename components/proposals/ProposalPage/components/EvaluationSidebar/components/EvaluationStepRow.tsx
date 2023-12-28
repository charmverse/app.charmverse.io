import type { ProposalEvaluation } from '@charmverse/core/prisma';
import styled from '@emotion/styled';
import { Accordion as MuiAccordion, AccordionDetails, AccordionSummary, Box, Typography } from '@mui/material';
import type { AccordionProps } from '@mui/material';
import type { ReactNode } from 'react';

import { StepperIcon } from './StepperIcon';

type Props = {
  title: string;
  result: ProposalEvaluation['result'];
  index: number;
  isCurrent?: boolean;
  expanded?: boolean;
  onChange?: (e: any, expanded: boolean) => void;
  actions?: ReactNode;
  children?: ReactNode;
};

const Accordion = styled((props: AccordionProps) => <MuiAccordion disableGutters elevation={0} square {...props} />)(
  ({ theme }) => ({
    border: 0,
    borderTop: `1px solid ${theme.palette.divider}`,
    '&:before': {
      display: 'none'
    }
  })
);

export function EvaluationStepRow({ expanded, onChange, isCurrent, result, index, title, children, actions }: Props) {
  return (
    <Accordion expanded={expanded} onChange={onChange}>
      <AccordionSummary sx={{ px: 1 }}>
        <Box display='flex' alignItems='center' gap={1} width='100%'>
          <StepperIcon result={result} isCurrent={isCurrent} position={index + 1} />
          <Typography variant='h6' sx={{ flexGrow: 1 }}>
            {title}
          </Typography>
          {actions}
        </Box>
      </AccordionSummary>
      {children && <AccordionDetails sx={{ px: 1 }}>{children}</AccordionDetails>}
    </Accordion>
  );
}
