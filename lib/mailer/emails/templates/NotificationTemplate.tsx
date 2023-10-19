import { Column } from '@react-email/column';
import { Hr } from '@react-email/hr';
import { Row } from '@react-email/row';
import { Section } from '@react-email/section';

import { getNotificationMetadata } from 'lib/notifications/getNotificationMetadata';
import type { Notification } from 'lib/notifications/interfaces';
import { getNodeFromJson } from 'lib/prosemirror/getNodeFromJson';
import { getFormattedDateTime } from 'lib/utilities/dates';
import { fancyTrim } from 'lib/utilities/strings';
import { baseUrl } from 'testing/mockApiCall';

import { Avatar, Button, EmailWrapper, Feedback, Text } from './components';

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
  const { spaceName, spaceDomain, createdAt, createdBy, id } = notification;
  const { href, content, pageTitle } = getNotificationMetadata(notification);
  const notificationContent = notification.group === 'document' ? notification.content : null;
  const dateTime = getFormattedDateTime(new Date(createdAt), {
    dateStyle: 'medium',
    timeStyle: 'short'
  });

  const text = notificationContent ? getNodeFromJson(notificationContent).textContent || '' : '';
  const link = `${baseUrl}/${spaceDomain}${href}?notificationId=${id}`;
  return (
    <Section
      style={{
        margin: '18px 0'
      }}
    >
      <Row>
        <Column style={{ width: 50, verticalAlign: 'top', paddingTop: 10 }}>
          <Avatar name={createdBy.username} avatar={createdBy.avatar} />
        </Column>
        <Column>
          <Text
            style={{
              margin: `6px 0px`
            }}
          >
            {content}
          </Text>
          <Text
            variant='caption'
            style={{
              margin: `6px 0px`
            }}
          >
            {dateTime}
          </Text>
          <Text
            variant='subtitle1'
            style={{
              margin: `6px 0px`
            }}
          >
            {spaceName}
          </Text>
          <Text
            bold
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
        </Column>
      </Row>
      <Button
        style={{
          width: '75%',
          margin: '10px auto'
        }}
        href={link}
      >
        View
      </Button>
    </Section>
  );
}
