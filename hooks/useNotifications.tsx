import type { NotificationType } from '@charmverse/core/prisma';
import { useRouter } from 'next/router';
import type { ReactNode } from 'react';
import { useEffect, useState, useCallback, createContext, useContext, useMemo } from 'react';
import type { KeyedMutator } from 'swr';
import useSWRImmutable from 'swr/immutable';

import charmClient from 'charmClient';
import {
  getBountiesNotificationPreviewItems,
  getDiscussionsNotificationPreviewItems,
  getForumNotificationPreviewItems,
  getProposalsNotificationPreviewItems,
  getVoteNotificationPreviewItems
} from 'components/common/PageLayout/components/Header/components/NotificationPreview/utils';
import { useUser } from 'hooks/useUser';
import type { NotificationActor, NotificationGroupType } from 'lib/notifications/interfaces';
import { userNotifications } from 'lib/notifications/utils';
import type { GetNotificationsResponse } from 'pages/api/notifications/list';

type MarkAsReadParams = { id: string; groupType: NotificationGroupType; type: NotificationType };
export type MarkNotificationAsRead = (params: MarkAsReadParams) => Promise<void>;

export type NotificationDetails = {
  spaceName: string;
  createdAt: string | Date;
  createdBy: NotificationActor;
  groupType: NotificationGroupType;
  type: NotificationType;
  id: string;
  content: string;
  pagePath: string;
  spaceDomain: string;
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
  notifications: GetNotificationsResponse;
  mutateNotifications: KeyedMutator<GetNotificationsResponse>;
};

const NotificationsContext = createContext<Readonly<Context>>({
  unmarkedNotificationPreviews: [],
  markedNotificationPreviews: [],
  markAsRead: async () => {},
  notificationDisplayType: null,
  openNotificationsModal: () => {},
  closeNotificationsModal: () => {},
  isLoading: false,
  notifications: userNotifications,
  mutateNotifications: async () => undefined
});

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user } = useUser();
  const {
    data: notifications = userNotifications,
    error: serverError,
    mutate: mutateNotifications,
    isLoading
  } = useSWRImmutable(
    user ? `/notifications/list/${user.id}` : null,
    () => charmClient.notifications.getNotifications(),
    {
      // 10 minutes
      refreshInterval: 1000 * 10 * 60
    }
  );

  const error = serverError?.message || serverError;

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
    if (!notifications) return [];
    return [
      ...getVoteNotificationPreviewItems(notifications.votes.unmarked),
      ...getProposalsNotificationPreviewItems(notifications.proposals.unmarked),
      ...getBountiesNotificationPreviewItems(notifications.bounties.unmarked),
      ...getDiscussionsNotificationPreviewItems(notifications.discussions.unmarked),
      ...getForumNotificationPreviewItems(notifications.forum.unmarked)
    ].sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1));
  }, [notifications]);

  const markedNotificationPreviews: NotificationDetails[] = useMemo(() => {
    if (!notifications) return [];
    return [
      ...getVoteNotificationPreviewItems(notifications.votes.marked),
      ...getProposalsNotificationPreviewItems(notifications.proposals.marked),
      ...getBountiesNotificationPreviewItems(notifications.bounties.marked),
      ...getDiscussionsNotificationPreviewItems(notifications.discussions.marked),
      ...getForumNotificationPreviewItems(notifications.forum.marked)
    ].sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1));
  }, [notifications]);

  const markAsRead: MarkNotificationAsRead = useCallback(
    async ({ id, type, groupType }: { id: string; groupType: NotificationGroupType; type: NotificationType }) => {
      await charmClient.notifications.markNotifications([{ id }]);

      mutateNotifications(
        (_notifications) => {
          if (!_notifications) {
            return;
          }

          const taskIndex = _notifications?.[groupType].unmarked.findIndex((t) => t.id === id);
          if (typeof taskIndex === 'number' && taskIndex > -1) {
            const marked = [_notifications?.[groupType].unmarked[taskIndex], ..._notifications[groupType].marked];
            const unmarkedItems = _notifications[groupType].unmarked;
            const unmarked = [...unmarkedItems.slice(0, taskIndex), ...unmarkedItems.slice(taskIndex + 1)];

            return {
              ..._notifications,
              [groupType]: {
                marked,
                unmarked
              }
            };
          }

          return _notifications;
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
      closeNotificationsModal,
      mutateNotifications,
      notifications
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
