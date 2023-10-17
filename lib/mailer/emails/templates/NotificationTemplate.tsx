import { Hr } from '@react-email/hr';
import { Link } from '@react-email/link';
import { Section } from '@react-email/section';

import { getNotificationMetadata } from 'lib/notifications/getNotificationMetadata';
import type { Notification } from 'lib/notifications/interfaces';
import { getNodeFromJson } from 'lib/prosemirror/getNodeFromJson';
import { getFormattedDateTime } from 'lib/utilities/dates';
import { fancyTrim } from 'lib/utilities/strings';
import { baseUrl } from 'testing/mockApiCall';

import { Button, EmailWrapper, Feedback, Text } from './components';

const MAX_CHAR = 60;

export function PendingNotification(notification: Notification) {
  return (
    <EmailWrapper title='Your open notifications' preview='Your open notifications'>
      <NotificationSection notification={notification} />
      <Hr />
      <Feedback />
    </EmailWrapper>
  );
}

function NotificationSection({ notification }: { notification: Notification }) {
  const { spaceName, spaceDomain, createdAt } = notification;
  const { href, content, pageTitle } = getNotificationMetadata(notification);
  const notificationContent = notification.group === 'document' ? notification.content : null;
  const dateTime = getFormattedDateTime(new Date(createdAt), {
    dateStyle: 'medium',
    timeStyle: 'short'
  });

  const text = notificationContent ? getNodeFromJson(notificationContent).textContent || '' : '';
  const link = `${baseUrl}/${spaceDomain}/${href}`;
  return (
    <Section
      style={{
        margin: '18px 0'
      }}
    >
      <Link
        href={link}
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
          variant='caption'
          style={{
            margin: `6px 0px`
          }}
        >
          {dateTime}
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
      <Button href={link}>View</Button>
    </Section>
  );
}
