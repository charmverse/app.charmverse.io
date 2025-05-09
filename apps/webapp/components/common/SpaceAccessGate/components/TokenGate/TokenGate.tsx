import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Accordion, AccordionDetails, AccordionSummary, Stack } from '@mui/material';
import Typography from '@mui/material/Typography';

import type { TokenGateContentProps } from './TokenGateContent';
import { TokenGateContent } from './TokenGateContent';

type Props = TokenGateContentProps & {
  displayAccordion?: boolean;
};

export function TokenGate({ displayAccordion, ...props }: Props) {
  if (displayAccordion) {
    return (
      <Accordion sx={{ mt: 2 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>Token gates</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <TokenGateContent {...props} />
        </AccordionDetails>
      </Accordion>
    );
  }

  return <TokenGateContent {...props} />;
}
