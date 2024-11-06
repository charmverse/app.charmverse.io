import { PageContainer } from 'components/layout/PageContainer';
import type { DailyClaim } from 'lib/users/getDailyClaims';
import type { QuestInfo } from 'lib/users/getUserQuests';

import { DailyClaimGallery } from './components/DailyClaimGallery/DailyClaimGallery';
import { QuestsList } from './components/QuestsList/QuestsList';

export function QuestsPage({ dailyClaims, quests }: { dailyClaims: DailyClaim[]; quests: QuestInfo[] }) {
  return (
    <PageContainer>
      <DailyClaimGallery dailyClaims={dailyClaims} />
      <QuestsList quests={quests} />
    </PageContainer>
  );
}
