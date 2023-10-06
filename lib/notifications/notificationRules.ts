import { prisma } from '@charmverse/core/prisma-client';

import type { NotificationGroup, NotificationType } from './interfaces';

/**
 * Example structure:
 * {
 *   'forum': false,
 *   'proposals.start_discussion': false,
 * }
 */
export type NotificationRuleOption = NotificationGroup | `${NotificationGroup}__${NotificationType}`;
export type NotificationRules = { [key in NotificationRuleOption]?: boolean };

export async function isNotificationEnabledForSpace({
  spaceId,
  group,
  type
}: {
  spaceId: string;
  group: NotificationGroup;
  type?: NotificationType;
}) {
  const { notificationRules } = await prisma.space.findUniqueOrThrow({
    where: {
      id: spaceId
    },
    select: {
      notificationRules: true
    }
  });

  return isNotificationEnabled({ group, type, rules: notificationRules as NotificationRules });
}

// Determine if a notification event is enabled
function isNotificationEnabled({
  group,
  type,
  rules
}: {
  group: NotificationGroup;
  type?: NotificationType;
  rules: NotificationRules;
}) {
  if (rules[group] === false) {
    return false;
  }
  if (type && rules[`${group}__${type}`] === false) {
    return false;
  }
  return true;
}
