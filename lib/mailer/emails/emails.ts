import type { PageInviteEmailProps } from './templates/PageInviteEmail';
import { emailSubject, PageInviteEmail } from './templates/PageInviteEmail';
import type { PendingNotifications } from './templates/PendingNotificationsTemplate';
import PendingTasks, { notificationsRequiresYourAttention } from './templates/PendingNotificationsTemplate';
import { renderMJML } from './templates/utils';

export function getPendingTasksEmail(props: PendingNotifications) {
  const html = renderMJML(PendingTasks(props));
  const subject = notificationsRequiresYourAttention({ count: props.totalNotifications, includeName: true });

  return { html, subject };
}

export function getPageInviteEmail(props: PageInviteEmailProps) {
  const html = renderMJML(PageInviteEmail(props));
  const subject = emailSubject(props);

  return { html, subject };
}
