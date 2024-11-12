'use client';

import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import { Stack, Typography } from '@mui/material';
import { useUser } from '@packages/scoutgame/components/layout/UserProvider';
import Image from 'next/image';
import { useAction } from 'next-safe-action/hooks';

import { completeQuestAction } from 'lib/quests/completeQuestAction';
import { QuestsRecord, type QuestInfo } from 'lib/quests/getQuests';

export function QuestCard({ quest }: { quest: QuestInfo }) {
  const { refreshUser } = useUser();
  const { execute, isExecuting } = useAction(completeQuestAction, {
    onSuccess: () => {
      refreshUser();
    }
  });

  return (
    <Stack
      sx={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 1,
        cursor: !quest.completed ? 'pointer' : 'default',
        zIndex: 1,
        bgcolor: quest.completed ? 'background.light' : 'primary.main',
        borderRadius: 1,
        p: 1.5
      }}
      onClick={() => {
        if (!quest.completed && !isExecuting) {
          execute({ questType: quest.type });
          const link = QuestsRecord[quest.type].link;
          if (link) {
            window.open(link, link.startsWith('http') ? '_blank' : '_self');
          }
        }
      }}
    >
      <Stack direction='row' gap={3.5} alignItems='center'>
        {QuestsRecord[quest.type].icon}
        <Stack gap={1}>
          <Typography fontWeight={500}>{QuestsRecord[quest.type].label}</Typography>
          <Stack direction='row' gap={0.5} alignItems='center'>
            <Typography variant='body2' fontWeight={500}>
              +{QuestsRecord[quest.type].points}
            </Typography>
            <Image src='/images/scout-game-profile-icon.png' alt='Scoutgame icon' width={18.5} height={12} />
          </Stack>
        </Stack>
      </Stack>
      {quest.completed ? <CheckCircleIcon color='secondary' /> : <KeyboardArrowRightIcon />}
    </Stack>
  );
}
