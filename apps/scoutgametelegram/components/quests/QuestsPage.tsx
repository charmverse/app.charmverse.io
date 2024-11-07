import { Box } from '@mui/material';

import { InfoBackgroundImage } from 'components/layout/InfoBackgroundImage';
import type { DailyClaim } from 'lib/claims/getDailyClaims';
import type { QuestInfo } from 'lib/quests/getQuests';

import { DailyClaimGallery } from './components/DailyClaimGallery/DailyClaimGallery';
import { QuestsList } from './components/QuestsList/QuestsList';

export function QuestsPage({ dailyClaims, quests }: { dailyClaims: DailyClaim[]; quests: QuestInfo[] }) {
  return (
    <>
      <InfoBackgroundImage />
      <Box sx={{ px: 5 }}>
        <DailyClaimGallery dailyClaims={dailyClaims} />
      </Box>
      <Box sx={{ px: 1 }}>
        <QuestsList quests={quests} />
      </Box>
    </>
  );
}
