import { Container } from '@mui/material';

import { InfoBackgroundImage } from 'components/layout/InfoBackgroundImage';
import type { DailyClaim } from 'lib/users/getDailyClaims';
import type { QuestInfo } from 'lib/users/getUserQuests';

import { DailyClaimGallery } from './components/DailyClaimGallery/DailyClaimGallery';
import { QuestsList } from './components/QuestsList/QuestsList';

export function QuestsPage({ dailyClaims, quests }: { dailyClaims: DailyClaim[]; quests: QuestInfo[] }) {
  return (
    <>
      <InfoBackgroundImage />
      <Container maxWidth='lg' sx={{ px: 5 }}>
        <DailyClaimGallery dailyClaims={dailyClaims} />
        <QuestsList quests={quests} />
      </Container>
    </>
  );
}
