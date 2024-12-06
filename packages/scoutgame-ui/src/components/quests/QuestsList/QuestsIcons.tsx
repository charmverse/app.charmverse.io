import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import XIcon from '@mui/icons-material/X';
import type { QuestType } from '@packages/scoutgame/quests/questRecords';
import Image from 'next/image';
import type { ReactNode } from 'react';

export const QuestIcon: Record<QuestType, ReactNode> = {
  'follow-x-account': <XIcon fontSize='large' />,
  'share-x-channel': <XIcon fontSize='large' />,
  'invite-friend': <Image src='/images/friends-icon.svg' alt='Friends icon' width={35} height={35} />
};
