export const notificationGroups = ['forum', 'documents', 'proposals', 'rewards', 'votes'] as const;
export type NotificationGroup = (typeof notificationGroups)[number];
