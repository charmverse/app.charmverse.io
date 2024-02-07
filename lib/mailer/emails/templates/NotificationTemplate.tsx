import type { User } from '@charmverse/core/prisma-client';
import { Column } from '@react-email/column';
import { Hr } from '@react-email/hr';
import { Img } from '@react-email/img';
import { Row } from '@react-email/row';
import { Section } from '@react-email/section';

import { baseUrl } from 'config/constants';
import type { FeatureJson } from 'lib/features/constants';
import { getNotificationMetadata } from 'lib/notifications/getNotificationMetadata';
import type { Notification } from 'lib/notifications/interfaces';
import { getNodeFromJson } from 'lib/prosemirror/getNodeFromJson';
import { getFormattedDateTime } from 'lib/utilities/dates';
import { fancyTrim } from 'lib/utilities/strings';

import { Avatar, Button, EmailWrapper, Feedback, Text } from './components';

const MAX_CHAR = 60;

export function PendingNotification({
  notification,
  user,
  spaceFeatures
}: {
  user: Pick<User, 'id' | 'username' | 'id' | 'avatar'>;
  notification: Notification;
  spaceFeatures: FeatureJson[];
}) {
  return (
    <EmailWrapper title='Your open notifications' preview='Your open notifications'>
      <NotificationSection spaceFeatures={spaceFeatures} user={user} notification={notification} />
      <Hr />
      <Feedback />
    </EmailWrapper>
  );
}

function NotificationSection({
  notification,
  user,
  spaceFeatures
}: {
  spaceFeatures: FeatureJson[];
  user: Pick<User, 'id' | 'username' | 'id' | 'avatar'>;
  notification: Notification;
}) {
  const { spaceName, spaceDomain, createdAt, createdBy, id } = notification;
  const { href, content, pageTitle } = getNotificationMetadata({ notification, spaceFeatures });
  const notificationContent = notification.group === 'document' ? notification.content : null;
  const dateTime = getFormattedDateTime(new Date(createdAt), {
    dateStyle: 'medium',
    timeStyle: 'short'
  });

  const text = notificationContent ? getNodeFromJson(notificationContent).textContent || '' : '';
  const link = `${baseUrl}/${spaceDomain}${href}${href.includes('?') ? '&' : '?'}notificationId=${id}`;
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
      {notification.type === 'person_assigned' && notification.personProperty ? (
        <>
          <Row>
            <Column style={{ width: 50, verticalAlign: 'top' }} />
            <Column>
              <Column style={{ width: 30 }}>
                <Img src={`${baseUrl}/images/person.png`} width={26} height={26} />
              </Column>
              <Column>
                <Text style={{ margin: 5 }} variant='subtitle1'>
                  {notification.personProperty.name}
                </Text>
              </Column>
            </Column>
          </Row>
          <Row style={{ marginTop: 5 }}>
            <Column style={{ width: 50, verticalAlign: 'top' }} />
            <Column>
              <Column style={{ width: 30 }}>
                <Avatar size='small' name={user.username} avatar={user.avatar} />
              </Column>
              <Column>
                <Text style={{ margin: 5 }} variant='subtitle1'>
                  {user.username}
                </Text>
              </Column>
            </Column>
          </Row>
        </>
      ) : null}

      <Row
        style={{
          margin: '6px auto'
        }}
      >
        <Column style={{ width: 50 }} />
        <Button href={link}>View</Button>
        <Column style={{ width: 50 }} />
      </Row>
    </Section>
  );
}
