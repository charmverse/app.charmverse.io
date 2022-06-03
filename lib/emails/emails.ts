
import PendingTasks, { PendingTasksProps } from './templates/PendingTasks';
import { renderMJML } from './templates/utils';

export function getPendingTasksEmail (props: PendingTasksProps) {

  const html = renderMJML(PendingTasks(props));
  const subject = 'CharmVerse: Your signature is required';

  return { html, subject };
}
