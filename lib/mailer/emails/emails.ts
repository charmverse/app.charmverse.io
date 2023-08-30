import type { InviteToPageProps } from './templates/InviteToPage';
import { emailSubject, InviteToPage } from './templates/InviteToPage';
import type { PendingTasksProps } from './templates/PendingTasks';
import PendingTasks, { tasksRequiresYourAttention } from './templates/PendingTasks';
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
