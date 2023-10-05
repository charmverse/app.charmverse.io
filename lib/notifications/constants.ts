export const notificationGroups = ['forum', 'documents', 'proposals', 'rewards', 'polls'] as const;
export type NotificationGroup = (typeof notificationGroups)[number];
