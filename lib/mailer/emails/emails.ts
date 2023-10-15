import { render } from '@react-email/render';

import type { PendingNotificationsData } from './templates/NotificationTemplate';
import { notificationsRequiresYourAttention, PendingNotifications } from './templates/NotificationTemplate';
import type { PageInviteEmailProps } from './templates/PageInviteEmail';
import { emailSubject, PageInviteEmail } from './templates/PageInviteEmail';

export function getPendingNotificationsEmail(props: PendingNotificationsData) {
  const html = render(PendingNotifications(props));
  const subject = notificationsRequiresYourAttention({ count: props.totalUnreadNotifications, includeName: true });

  return { html, subject };
}

export function getPageInviteEmail(props: PageInviteEmailProps) {
  const html = render(PageInviteEmail(props));
  const subject = emailSubject(props);

  return { html, subject };
}
