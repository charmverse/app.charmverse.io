import type { NotificationType } from '@charmverse/core/prisma';
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
import type { NotificationActor, NotificationGroupType } from 'lib/notifications/interfaces';

type MarkAsReadParams = { taskId: string; groupType: NotificationGroupType; type: NotificationType };
export type MarkNotificationAsRead = (params: MarkAsReadParams) => Promise<void>;

export type NotificationDetails = {
  spaceName: string;
  createdAt: string | Date;
  createdBy: NotificationActor;
  groupType: NotificationGroupType;
  type: NotificationType;
  taskId: string;
  content: string;
  href: string;
  title: string;
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
  isLoading: boolean;
};

const NotificationsContext = createContext<Readonly<Context>>({
  unmarkedNotificationPreviews: [],
  markedNotificationPreviews: [],
  markAsRead: async () => {},
  notificationDisplayType: null,
  openNotificationsModal: () => {},
  closeNotificationsModal: () => {},
  isLoading: false
});

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { tasks, mutate: mutateTasks, isLoading } = useTasks();
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
      ...getVoteNotificationPreviewItems(tasks.votes.unmarked),
      ...getProposalsNotificationPreviewItems(tasks.proposals.unmarked),
      ...getBountiesNotificationPreviewItems(tasks.bounties.unmarked),
      ...getDiscussionsNotificationPreviewItems(tasks.discussions.unmarked),
      ...getForumNotificationPreviewItems(tasks.forum.unmarked)
    ].sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1));
  }, [tasks]);

  const markedNotificationPreviews: NotificationDetails[] = useMemo(() => {
    if (!tasks) return [];
    return [
      ...getVoteNotificationPreviewItems(tasks.votes.marked),
      ...getProposalsNotificationPreviewItems(tasks.proposals.marked),
      ...getBountiesNotificationPreviewItems(tasks.bounties.marked),
      ...getDiscussionsNotificationPreviewItems(tasks.discussions.marked),
      ...getForumNotificationPreviewItems(tasks.forum.marked)
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
            const marked = [_tasks?.[groupType].unmarked[taskIndex], ..._tasks[groupType].marked];
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
      isLoading,
      unmarkedNotificationPreviews,
      markedNotificationPreviews,
      markAsRead,
      notificationDisplayType,
      openNotificationsModal,
      closeNotificationsModal
    }),
    [
      isLoading,
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
