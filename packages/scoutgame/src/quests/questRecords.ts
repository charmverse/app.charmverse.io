type QuestRecord = {
  points: number;
  label: string;
  link?: string;
};

export type QuestType = 'follow-x-account' | 'share-x-telegram' | 'invite-friend';

export type QuestInfo = {
  type: QuestType;
  completed: boolean;
} & QuestRecord;

export const questsRecord: Record<QuestType, QuestRecord> = {
  'follow-x-account': {
    points: 50,
    label: 'Follow @scoutgamexyz',
    link: 'https://x.com/@scoutgamexyz'
  },
  'share-x-telegram': {
    points: 50,
    label: 'Share our Telegram',
    link: `https://x.com/intent/tweet?text=${encodeURIComponent(
      "I'm playing @scoutgamexyz on Telegram! 🕹️ Come join me, play in the channel, and discover top builders while earning points and rewards. Let’s scout together! 👉 https://t.me/+J0dl4_uswBY2NTkx #PlayAndEarn"
    )}`
  },
  'invite-friend': {
    points: 5,
    label: 'Invite a friend'
  }
};
