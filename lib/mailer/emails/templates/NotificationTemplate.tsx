import type { User } from '@charmverse/core/prisma';
import { Hr } from '@react-email/hr';
import { Link } from '@react-email/link';
import { Section } from '@react-email/section';

import { getNotificationMetadata } from 'lib/notifications/getNotificationMetadata';
import type {
  BountyNotification,
  CardNotification,
  DocumentNotification,
  Notification,
  PostNotification,
  ProposalNotification,
  VoteNotification
} from 'lib/notifications/interfaces';
import { getNodeFromJson } from 'lib/prosemirror/getNodeFromJson';
import { fancyTrim } from 'lib/utilities/strings';
import { baseUrl } from 'testing/mockApiCall';

import { EmailWrapper, Feedback, Text } from './components';

const MAX_ITEMS_PER_NOTIFICATION = 3;
const MAX_CHAR = 60;

export type PendingNotificationsData = {
  cardNotifications: CardNotification[];
  documentNotifications: DocumentNotification[];
  totalUnreadNotifications: number;
  voteNotifications: VoteNotification[];
  proposalNotifications: ProposalNotification[];
  bountyNotifications: BountyNotification[];
  forumNotifications: PostNotification[];
  // eslint-disable-next-line
  user: Pick<User, 'id' | 'username'> & { email: string };
};

function NotificationSections({ notifications }: { notifications: Notification[] }) {
  return notifications.length > 0 ? (
    <>
      {notifications.slice(0, MAX_ITEMS_PER_NOTIFICATION).map((notification) => (
        <NotificationSection key={notification.id} notification={notification} />
      ))}
      <Hr />
    </>
  ) : null;
}

export function PendingNotifications(props: PendingNotificationsData) {
  return (
    <EmailWrapper title='Your open notifications' preview='Your open notifications'>
      <Text
        style={{
          padding: 0,
          fontSize: 24,
          fontWeight: 'bold'
        }}
      >
        {notificationsRequiresYourAttention({
          count: props.totalUnreadNotifications
        })}
      </Text>
      <NotificationSections notifications={props.documentNotifications} />
      <NotificationSections notifications={props.cardNotifications} />
      <NotificationSections notifications={props.voteNotifications} />
      <NotificationSections notifications={props.proposalNotifications} />
      <NotificationSections notifications={props.bountyNotifications} />
      <NotificationSections notifications={props.forumNotifications} />
      <Feedback />
    </EmailWrapper>
  );
}

function NotificationSection({ notification }: { notification: Notification }) {
  const { spaceName, spaceDomain } = notification;
  const { href, content, pageTitle } = getNotificationMetadata(notification);
  const notificationContent = notification.group === 'document' ? notification.content : null;

  const text = notificationContent ? getNodeFromJson(notificationContent).textContent || '' : '';

  return (
    <Section
      style={{
        margin: '18px 0'
      }}
    >
      <Link
        href={`${baseUrl}/${spaceDomain}/${href}`}
        style={{
          color: 'inherit'
        }}
      >
        <Text
          style={{
            margin: `6px 0px`
          }}
        >
          {content}
        </Text>
        <Text
          style={{
            margin: `6px 0px`,
            fontSize: 16,
            opacity: 0.65,
            fontWeight: 400,
            textOverflow: 'ellipsis',
            overflow: 'hidden',
            whiteSpace: 'nowrap'
          }}
        >
          {spaceName}
        </Text>
        <Text
          style={{
            margin: `6px 0px`,
            textOverflow: 'ellipsis',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            fontWeight: 'bold'
          }}
        >
          {pageTitle}
        </Text>
        <Text
          style={{
            margin: `6px 0px`
          }}
        >
          {fancyTrim(text, MAX_CHAR)}
        </Text>
      </Link>
    </Section>
  );
}

export function notificationsRequiresYourAttention({ count, includeName }: { count: number; includeName?: boolean }) {
  return `${count} ${includeName ? 'CharmVerse ' : ''}notification${count > 1 ? 's' : ''} need${
    count > 1 ? '' : 's'
  } your attention`;
}
