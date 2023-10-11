import type { PageInviteEmailProps } from './templates/PageInviteEmail';
import { emailSubject, PageInviteEmail } from './templates/PageInviteEmail';
import type { PendingNotificationsData } from './templates/PendingNotificationsTemplate';
import PendingNotifications, { notificationsRequiresYourAttention } from './templates/PendingNotificationsTemplate';
import { renderMJML } from './templates/utils';

export function getPendingNotificationsEmail(props: PendingNotificationsData) {
  const html = renderMJML(PendingNotifications(props));
  const subject = notificationsRequiresYourAttention({ count: props.totalUnreadNotifications, includeName: true });

  return { html, subject };
}

export function getPageInviteEmail(props: PageInviteEmailProps) {
  const html = renderMJML(PageInviteEmail(props));
  const subject = emailSubject(props);

  return { html, subject };
}
