import { render } from '@react-email/render';
import { htmlToText } from 'html-to-text';

import { getNotificationMetadata } from 'lib/notifications/getNotificationMetadata';
import type { Notification } from 'lib/notifications/interfaces';

import { PendingNotification } from './templates/NotificationTemplate';
import type { PageInviteEmailProps } from './templates/PageInviteEmail';
import { emailSubject, PageInviteEmail } from './templates/PageInviteEmail';

export function getPendingNotificationEmail(notification: Notification) {
  const html = render(PendingNotification(notification));
  const subject = htmlToText(`${getNotificationMetadata(notification).content}`);

  return { html, subject };
}

export function getPageInviteEmail(props: PageInviteEmailProps) {
  const html = render(PageInviteEmail(props));
  const subject = emailSubject(props);

  return { html, subject };
}
