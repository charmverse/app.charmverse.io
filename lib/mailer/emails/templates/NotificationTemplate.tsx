import type { User } from '@charmverse/core/prisma';
import { Link } from '@react-email/link';
import { Section } from '@react-email/section';

import { getNotificationMetadata } from 'lib/notifications/getNotificationMetadata';
import type { Notification } from 'lib/notifications/interfaces';
import { getNodeFromJson } from 'lib/prosemirror/getNodeFromJson';
import { fancyTrim } from 'lib/utilities/strings';
import { baseUrl } from 'testing/mockApiCall';

import { EmailWrapper, Feedback, Text } from './components';

const MAX_CHAR = 60;

export type PendingNotificationsData = {
  notification: Notification;
};

export function PendingNotifications({ notification }: PendingNotificationsData) {
  return (
    <EmailWrapper title='Your open notifications' preview='Your open notifications'>
      <NotificationSection notification={notification} />
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
          hideOverflow
          variant='subtitle1'
          style={{
            margin: `6px 0px`
          }}
        >
          {spaceName}
        </Text>
        <Text
          bold
          hideOverflow
          style={{
            margin: `6px 0px`
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
