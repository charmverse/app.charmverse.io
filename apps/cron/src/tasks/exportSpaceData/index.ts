import { log } from '@charmverse/core/log';

import { isProcessRunning } from '../../processStatus';

import { exportSpaceDataTask, checkStaleExportJobs } from './exportSpaceDataTask';

// run this every 500ms to check for new jobs
export async function task() {
  await checkStaleExportJobs();
  await exportSpaceDataTask();
  if (isProcessRunning()) {
    setTimeout(task, 500);
  } else {
    log.info('Discontinue polling for exports, process is exiting');
  }
}
