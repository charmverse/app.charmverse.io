import { prisma } from '@charmverse/core/prisma-client';

import type { NotificationGroup, NotificationType } from './interfaces';

/**
 * @example NotificationToggles
 * {
 *   'forum': false,
 *   'proposals__start_discussion': false,
 * }
 */
export type NotificationToggleOption = NotificationGroup | `${NotificationGroup}__${NotificationType}`;
export type NotificationToggles = { [key in NotificationToggleOption]?: boolean };

export async function getNotificationToggles({ spaceId }: { spaceId: string }) {
  const { notificationToggles } = await prisma.space.findUniqueOrThrow({
    where: {
      id: spaceId
    },
    select: {
      notificationToggles: true
    }
  });
  return notificationToggles as NotificationToggles;
}

// Determine if a notification event is enabled
export function isNotificationEnabled({
  group,
  type,
  rules
}: {
  group: NotificationGroup;
  type?: NotificationType;
  rules: NotificationToggles;
}) {
  if (rules[group] === false) {
    return false;
  }
  if (type && rules[`${group}__${type}`] === false) {
    return false;
  }
  return true;
}
