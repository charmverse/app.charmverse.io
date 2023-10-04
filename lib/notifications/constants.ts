export const notificationGroups = ['forum', 'discussions', 'votes', 'proposals', 'rewards'] as const;
export type NotificationGroup = (typeof notificationGroups)[number];
