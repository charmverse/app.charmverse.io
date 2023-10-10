export const notificationGroups = ['forum', 'proposals', 'rewards', 'polls'] as const;
export type NotificationGroup = (typeof notificationGroups)[number];
