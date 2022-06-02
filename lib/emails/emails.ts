
import PendingTasks, { PendingTasksProps } from './templates/PendingTasks';
import { renderMJML } from './templates/utils';

export function getPendingTasksEmail (props: PendingTasksProps) {

  const html = renderMJML(PendingTasks(props));
  const subject = `CharmVerse: You have ${props.tasks.length} open tasks`;

  return { html, subject };
}
