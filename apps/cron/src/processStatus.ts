import { log } from '@packages/core/log';

let isRunning = true;

// this allows recurring polling tasks to check if the process should continue running
export function isProcessRunning() {
  return isRunning;
}

async function cleanup() {
  isRunning = false;
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
