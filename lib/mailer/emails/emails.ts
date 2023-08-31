import type { InviteToPageProps } from './templates/InviteToPageTemplate';
import { emailSubject, InviteToPage } from './templates/InviteToPageTemplate';
import type { PendingTasksProps } from './templates/PendingTasksTemplate';
import PendingTasks, { tasksRequiresYourAttention } from './templates/PendingTasksTemplate';
import { renderMJML } from './templates/utils';

export function getPendingTasksEmail(props: PendingTasksProps) {
  const html = renderMJML(PendingTasks(props));
  const subject = tasksRequiresYourAttention({ count: props.totalTasks, includeName: true });

  return { html, subject };
}

export function getInviteToPageEmail(props: InviteToPageProps) {
  const html = renderMJML(InviteToPage(props));
  const subject = emailSubject(props);

  return { html, subject };
}
