import { prisma } from '@charmverse/core/prisma-client';

import type { NotificationGroup } from './constants';
import { notificationGroups } from './constants';

type NotificationRule = {
  exclude: NotificationGroup;
};

function isGroupEnabled(group: NotificationGroup, rules: NotificationRule[]) {
  return !rules.some((rule) => rule.exclude === group);
}

export async function isGroupEnabledForUser(userId: string, group: NotificationGroup) {
  const { notificationRules } = await prisma.user.findUnique({
    where: {
      id: userId
    },
    select: {
      notificationRules: true
    }
  });

  return isGroupEnabled(group, notificationRules);
}
