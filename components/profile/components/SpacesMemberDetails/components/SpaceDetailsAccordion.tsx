import styled from '@emotion/styled';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Accordion, AccordionDetails, AccordionSummary, Typography } from '@mui/material';

import type { PropertyValueWithDetails } from 'lib/members/interfaces';

type Props = {
  spaceId: string;
  spaceName: string;
  memberId: string;
  properties: PropertyValueWithDetails[];
};

const StyledAccordion = styled(Accordion)`
  &.MuiPaper-root {
    margin-top: 0;
  }
`;

export function SpaceDetailsAccordion ({ spaceId, spaceName, memberId, properties }: Props) {
  return (
    <StyledAccordion>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}><Typography>{spaceName}</Typography></AccordionSummary>
      <AccordionDetails><Typography>property details...</Typography></AccordionDetails>
    </StyledAccordion>
  );
}
