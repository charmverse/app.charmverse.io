import { log } from '@packages/core/log';

export async function checkDuration<T>(
  callback: (...args: any[]) => Promise<T>,
  options: { args: Parameters<typeof callback>; logMessage?: string }
): Promise<T> {
  performance.mark('start');
  const data = await callback(...options.args);
  performance.mark('end');
  const measure = performance.measure('measureFn', 'start', 'end');
  const executionTime = measure.duration / 1000; // seconds

  const logMessage = options.logMessage || 'Loaded function in ';
  log.info(`${logMessage} ${executionTime}s`);

  return data;
}
