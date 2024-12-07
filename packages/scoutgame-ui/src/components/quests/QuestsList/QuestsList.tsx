import type { ScoutSocialQuest } from '@charmverse/core/prisma-client';
import { Typography, Stack } from '@mui/material';
import type { QuestInfo, QuestType } from '@packages/scoutgame/quests/questRecords';
import { questsRecord } from '@packages/scoutgame/quests/questRecords';
import type { SessionUser } from '@packages/scoutgame/session/interfaces';

import { Hidden } from '../../common/Hidden';

import { FriendlyQuest } from './FriendlyQuest';
import { QuestAccordion } from './QuestAccordion';
import { QuestCard } from './QuestCard';

export function QuestsList({ quests, friends }: { quests: ScoutSocialQuest[]; friends: SessionUser[] }) {
  const socialQuests: QuestInfo[] = (Object.keys(questsRecord) as QuestType[]).map((type) => ({
    type,
    completed: quests.some((quest) => quest.type === type),
    ...questsRecord[type]
  }));

  const inviteFriendsQuest = socialQuests.find((quest) => quest.type === 'invite-friend');

  return (
    <Stack justifyContent='center' alignItems='center' gap={1} mt={4}>
      <Typography variant='h4' color='secondary' fontWeight={600} zIndex={1}>
        Quests
      </Typography>
      <Stack width='100%' gap={1}>
        <Hidden mdUp>
          {inviteFriendsQuest && (
            <QuestAccordion quest={inviteFriendsQuest}>
              <FriendlyQuest friends={friends} />
            </QuestAccordion>
          )}
        </Hidden>
        {socialQuests
          .filter((quest) => quest.type !== 'invite-friend')
          .map((quest) => (
            <QuestCard quest={quest} key={quest.type} />
          ))}
      </Stack>
    </Stack>
  );
}
