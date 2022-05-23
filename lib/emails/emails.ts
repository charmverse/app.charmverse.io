
import PendingTasks, { PendingTasksProps } from './templates/PendingTasks';
import { renderMJML } from './templates/utils';

export function getPendingTasksEmail ({ tasks }: PendingTasksProps) {

  const html = renderMJML(PendingTasks({ tasks }));
  const subject = 'You have 6 Gnosis transactions to sign';

  return { html, subject };
}
