import type { NotificationType } from '@prisma/client';
import { useRouter } from 'next/router';
import type { ReactNode } from 'react';
import { useEffect, useState, useCallback, createContext, useContext, useMemo } from 'react';

import charmClient from 'charmClient';
import {
  getBountiesNotificationPreviewItems,
  getDiscussionsNotificationPreviewItems,
  getForumNotificationPreviewItems,
  getProposalsNotificationPreviewItems,
  getVoteNotificationPreviewItems
} from 'components/common/PageLayout/components/Header/components/NotificationPreview/utils';
import { useTasks } from 'components/nexus/hooks/useTasks';
import { useUser } from 'hooks/useUser';
import type { TaskUser } from 'lib/discussion/interfaces';
import type { NotificationGroupType } from 'lib/notifications/interfaces';
import type { NotificationActor } from 'lib/notifications/mapNotificationActor';

type MarkAsReadParams = { taskId: string; groupType: NotificationGroupType; type: NotificationType };
export type MarkNotificationAsRead = (params: MarkAsReadParams) => Promise<void>;

export type NotificationDetails = {
  spaceName: string;
  createdAt: string | Date;
  createdBy: NotificationActor | TaskUser | null;
  groupType: NotificationGroupType;
  type: NotificationType;
  taskId: string;
  content: string;
  href: string;
  title: string;
  unmarked: boolean;
};

export type NotificationDisplayType = 'all' | 'bounty' | 'vote' | 'mention' | 'proposal' | 'forum';
const notificationDisplayTypes: NotificationDisplayType[] = ['all', 'bounty', 'vote', 'mention', 'proposal', 'forum'];

export const isNotificationDisplayType = (type: string): type is NotificationDisplayType =>
  notificationDisplayTypes.includes(type as NotificationDisplayType);

type Context = {
  unmarkedNotificationPreviews: NotificationDetails[];
  markedNotificationPreviews: NotificationDetails[];
  markAsRead: MarkNotificationAsRead;
  notificationDisplayType: NotificationDisplayType | null;
  openNotificationsModal: (type?: NotificationDisplayType) => void;
  closeNotificationsModal: () => void;
};

const NotificationsContext = createContext<Readonly<Context>>({
  unmarkedNotificationPreviews: [],
  markedNotificationPreviews: [],
  markAsRead: async () => {},
  notificationDisplayType: null,
  openNotificationsModal: () => {},
  closeNotificationsModal: () => {}
});

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { tasks, mutate: mutateTasks } = useTasks();
  const { user } = useUser();
  const currentUserId = user?.id;
  const { query, isReady } = useRouter();
  const [notificationDisplayType, setNotificationDisplayType] = useState<NotificationDisplayType | null>(null);

  useEffect(() => {
    const notificationQueryParam = typeof query.notifications === 'string' ? query.notifications : null;
    if (notificationQueryParam && isReady) {
      const displayType = isNotificationDisplayType(notificationQueryParam) ? notificationQueryParam : 'all';
      setNotificationDisplayType(displayType);
    }
  }, [isReady, query.notifications]);

  const unmarkedNotificationPreviews: NotificationDetails[] = useMemo(() => {
    if (!tasks) return [];
    return [
      ...getVoteNotificationPreviewItems({ notifications: tasks.votes.unmarked, currentUserId, unmarked: true }),
      ...getProposalsNotificationPreviewItems({
        notifications: tasks.proposals.unmarked,
        currentUserId,
        unmarked: true
      }),
      ...getBountiesNotificationPreviewItems({ notifications: tasks.bounties.unmarked, unmarked: true }),
      ...getDiscussionsNotificationPreviewItems({ notifications: tasks.discussions.unmarked, unmarked: true }),
      ...getForumNotificationPreviewItems({ notifications: tasks.forum.unmarked, unmarked: true })
    ].sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1));
  }, [tasks]);

  const markedNotificationPreviews: NotificationDetails[] = useMemo(() => {
    if (!tasks) return [];
    return [
      ...getVoteNotificationPreviewItems({ notifications: tasks.votes.marked, currentUserId, unmarked: false }),
      ...getProposalsNotificationPreviewItems({
        notifications: tasks.proposals.marked,
        currentUserId,
        unmarked: false
      }),
      ...getBountiesNotificationPreviewItems({ notifications: tasks.bounties.marked, unmarked: false }),
      ...getDiscussionsNotificationPreviewItems({ notifications: tasks.discussions.marked, unmarked: false }),
      ...getForumNotificationPreviewItems({ notifications: tasks.forum.marked, unmarked: false })
    ].sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1));
  }, [tasks]);

  const markAsRead: MarkNotificationAsRead = useCallback(
    async ({
      taskId,
      type,
      groupType
    }: {
      taskId: string;
      groupType: NotificationGroupType;
      type: NotificationType;
    }) => {
      await charmClient.tasks.markTasks([{ id: taskId, type }]);

      mutateTasks(
        (_tasks) => {
          if (!_tasks) {
            return;
          }

          const taskIndex = _tasks?.[groupType].unmarked.findIndex((t) => t.taskId === taskId);
          if (typeof taskIndex === 'number' && taskIndex > -1) {
            const markedTask = { ..._tasks?.[groupType].unmarked[taskIndex], unmarked: false };
            const marked = [markedTask, ..._tasks[groupType].marked];
            const unmarkedItems = _tasks[groupType].unmarked;
            const unmarked = [...unmarkedItems.slice(0, taskIndex), ...unmarkedItems.slice(taskIndex + 1)];

            return {
              ..._tasks,
              [groupType]: {
                marked,
                unmarked
              }
            };
          }

          return _tasks;
        },
        {
          revalidate: false
        }
      );
    },
    []
  );

  const openNotificationsModal = useCallback((tab: NotificationDisplayType = 'all') => {
    setNotificationDisplayType(tab);
  }, []);

  const closeNotificationsModal = useCallback(() => {
    setNotificationDisplayType(null);
  }, []);

  const value = useMemo(
    () => ({
      unmarkedNotificationPreviews,
      markedNotificationPreviews,
      markAsRead,
      notificationDisplayType,
      openNotificationsModal,
      closeNotificationsModal
    }),
    [
      unmarkedNotificationPreviews,
      markedNotificationPreviews,
      markAsRead,
      notificationDisplayType,
      openNotificationsModal,
      closeNotificationsModal
    ]
  );

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export const useNotifications = () => useContext(NotificationsContext);
