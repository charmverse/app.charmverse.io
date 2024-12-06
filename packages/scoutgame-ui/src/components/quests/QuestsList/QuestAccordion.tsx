import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Accordion, AccordionDetails, AccordionSummary, Stack, Typography } from '@mui/material';
import Image from 'next/image';
import type { ReactNode } from 'react';

import type { QuestInfo } from './QuestsRecord';

export function QuestAccordion({ quest, children }: { quest: QuestInfo; children: ReactNode }) {
  return (
    <Accordion sx={{ bgcolor: 'transparent' }} disableGutters data-test={`quest-${quest.type}`}>
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        aria-controls={`${quest.type}-content`}
        id={quest.type}
        sx={{ bgcolor: 'primary.main', borderRadius: 1 }}
      >
        <Stack direction='row' gap={3.5} alignItems='center'>
          {quest.icon}
          <Stack gap={1}>
            <Typography fontWeight={500}>{quest.label}</Typography>
            <Stack direction='row' gap={0.5} alignItems='center'>
              <Typography variant='body2' fontWeight={500}>
                +{quest.points}
              </Typography>
              <Image src='/images/profile/scout-game-profile-icon.png' alt='Scoutgame icon' width={18.5} height={12} />
            </Stack>
          </Stack>
        </Stack>
      </AccordionSummary>
      <AccordionDetails sx={{ px: 0, py: 2 }}>{children}</AccordionDetails>
    </Accordion>
  );
}
