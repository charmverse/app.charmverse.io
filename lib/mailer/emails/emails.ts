import type { GuestInvitationProps } from './templates/GuestInvitation';
import { emailSubject, GuestInvitation } from './templates/GuestInvitation';
import type { PendingTasksProps } from './templates/PendingTasks';
import PendingTasks, { tasksRequiresYourAttention } from './templates/PendingTasks';
import { renderMJML } from './templates/utils';

export function getPendingTasksEmail(props: PendingTasksProps) {
  const html = renderMJML(PendingTasks(props));
  const subject = tasksRequiresYourAttention({ count: props.totalTasks, includeName: true });

  return { html, subject };
}

export function getGuestInvitationEmail(props: GuestInvitationProps) {
  const html = renderMJML(GuestInvitation(props));
  const subject = emailSubject(props);

  return { html, subject };
}
