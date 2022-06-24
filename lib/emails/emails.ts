
import PendingTasks, { PendingTasksProps } from './templates/PendingTasks';
import { renderMJML } from './templates/utils';

export function getPendingTasksEmail (props: PendingTasksProps) {

  const html = renderMJML(PendingTasks(props));
  const totalTasks = props.totalTasks;
  const subject = `${totalTasks} CharmVerse ${totalTasks > 1 ? 'tasks' : 'task'} require your attention`;

  return { html, subject };
}
