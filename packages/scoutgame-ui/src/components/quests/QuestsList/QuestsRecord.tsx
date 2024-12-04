import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import XIcon from '@mui/icons-material/X';
import Image from 'next/image';
import type { ReactNode } from 'react';

type QuestRecord = {
  points: number;
  icon: ReactNode;
  label: string;
  link?: string;
};

export type QuestInfo = {
  type: string;
  completed: boolean;
} & QuestRecord;

export const QuestsRecord: Record<string, QuestRecord> = {
  'follow-x-account': {
    points: 50,
    icon: <XIcon fontSize='large' />,
    label: 'Follow @scoutgamexyz',
    link: 'https://x.com/@scoutgamexyz'
  },
  'share-x-channel': {
    points: 50,
    icon: <XIcon fontSize='large' />,
    label: 'Share this channel',
    link: `https://x.com/intent/tweet?text=${encodeURIComponent(
      "I'm playing @scoutgamexyz on Telegram! 🕹️ Come join me, play in the channel, and discover top builders while earning points and rewards. Let’s scout together! 👉 https://t.me/+J0dl4_uswBY2NTkx #PlayAndEarn"
    )}`
  },
  'watch-gameplay-video': {
    points: 50,
    icon: <PlayCircleOutlineIcon fontSize='large' />,
    label: 'Watch game play video',
    link: 'https://www.youtube.com/@scoutgamexyz'
  },
  'invite-friend': {
    points: 5,
    icon: <Image src='/images/friends-icon.svg' alt='Friends icon' width={35} height={35} />,
    label: 'Invite a friend',
    link: '/friends'
  }
};
