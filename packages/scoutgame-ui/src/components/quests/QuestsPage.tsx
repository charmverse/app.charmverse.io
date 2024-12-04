import type { ScoutSocialQuest } from '@charmverse/core/prisma-client';
import { Box } from '@mui/material';
import type { DailyClaim } from '@packages/scoutgame/claims/getDailyClaims';
import { DailyClaimGallery } from '@packages/scoutgame-ui/components/quests/DailyClaimGallery/DailyClaimGallery';
import { QuestsList } from '@packages/scoutgame-ui/components/quests/QuestsList/QuestsList';

export function QuestsPage({ dailyClaims, quests }: { dailyClaims: DailyClaim[]; quests: ScoutSocialQuest[] }) {
  return (
    <>
      <Box sx={{ px: 5 }}>
        <DailyClaimGallery dailyClaims={dailyClaims} />
      </Box>
      <Box sx={{ px: 1, mb: 2 }}>
        <QuestsList quests={quests} />
      </Box>
    </>
  );
}
