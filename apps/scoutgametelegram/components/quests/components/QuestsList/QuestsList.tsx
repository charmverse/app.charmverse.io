import { Typography, Stack } from '@mui/material';

import type { QuestInfo } from 'lib/quests/getQuests';

import { QuestCard } from './QuestCard';

export function QuestsList({ quests }: { quests: QuestInfo[] }) {
  return (
    <Stack justifyContent='center' alignItems='center' gap={1} mt={4}>
      <Typography variant='h4' color='secondary' fontWeight={600} zIndex={1}>
        Quests
      </Typography>
      <Stack zIndex={1} width='100%' gap={1}>
        {quests.map((quest) => (
          <QuestCard quest={quest} key={quest.type} />
        ))}
      </Stack>
    </Stack>
  );
}
