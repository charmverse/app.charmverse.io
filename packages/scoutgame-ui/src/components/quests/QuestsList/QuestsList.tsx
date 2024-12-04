import type { ScoutSocialQuest } from '@charmverse/core/prisma-client';
import { Typography, Stack } from '@mui/material';

import { QuestCard } from './QuestCard';
import { QuestsRecord } from './QuestsRecord';
import type { QuestInfo } from './QuestsRecord';

export function QuestsList({ quests }: { quests: ScoutSocialQuest[] }) {
  const socialQuests: QuestInfo[] = Object.keys(QuestsRecord).map((type) => ({
    type,
    completed: quests.some((quest) => quest.type === type),
    ...QuestsRecord[type]
  }));

  return (
    <Stack justifyContent='center' alignItems='center' gap={1} mt={4}>
      <Typography variant='h4' color='secondary' fontWeight={600} zIndex={1}>
        Quests
      </Typography>
      <Stack zIndex={1} width='100%' gap={1}>
        {socialQuests.map((quest) => (
          <QuestCard quest={quest} key={quest.type} />
        ))}
      </Stack>
    </Stack>
  );
}
