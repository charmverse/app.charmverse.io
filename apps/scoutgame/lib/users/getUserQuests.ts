import { prisma } from '@charmverse/core/prisma-client';

export const questsRecord: Record<
  string,
  {
    label: string;
    amount: number;
  }
> = {
  'follow-x-account': {
    label: 'Follow @scoutgamexyz',
    amount: 50
  },
  'share-telegram-channel': {
    label: 'Share this channel',
    amount: 50
  },
  'watch-gameplay-video': {
    label: 'Watch game play video',
    amount: 50
  },
  'invite-friend': {
    label: 'Invite a friend',
    amount: 5
  }
};

const questActivities = Object.keys(questsRecord);

export type QuestInfo = {
  activity: string;
  amount: number;
  label: string;
  completed: boolean;
};

export async function getUserQuests(userId: string): Promise<QuestInfo[]> {
  const quest = await prisma.scoutQuest.findFirst({
    where: {
      userId
    }
  });

  const completedQuests = (quest?.completedQuests ?? []) as string[];

  return questActivities.map((questActivity) => {
    return {
      activity: questActivity,
      amount: questsRecord[questActivity].amount,
      label: questsRecord[questActivity].label,
      completed: completedQuests.includes(questActivity)
    };
  });
}
