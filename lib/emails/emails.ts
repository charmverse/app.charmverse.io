import type { AddedAsGuestProps } from './templates/AddedAsGuest';
import { addedAsGuestTitle, AddedAsGuest } from './templates/AddedAsGuest';
import type { PendingTasksProps } from './templates/PendingTasks';
import PendingTasks, { tasksRequiresYourAttention } from './templates/PendingTasks';
import { renderMJML } from './templates/utils';

export function getPendingTasksEmail(props: PendingTasksProps) {
  const html = renderMJML(PendingTasks(props));
  const subject = tasksRequiresYourAttention({ count: props.totalTasks, includeName: true });

  return { html, subject };
}

export function getAddedAsGuestEmail(props: AddedAsGuestProps) {
  const html = renderMJML(AddedAsGuest(props));
  const subject = addedAsGuestTitle(props);

  return { html, subject };
}
