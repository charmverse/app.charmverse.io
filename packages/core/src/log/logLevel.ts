import { datadogLogs } from '@datadog/browser-logs';
import { isNodeEnv, isProdEnv, isStagingEnv } from '@packages/config/constants';
import type { Logger, LogLevelDesc } from 'loglevel';
import _log from 'loglevel';

import { formatLog } from './logUtils';
import { sendToDatadog } from './sendToDatadog';

const originalFactory = _log.methodFactory;
const enableDatadogLogs = isProdEnv && !isNodeEnv;

/**
 * Enable formatting special logs for Datadog in production
 * Example:
 *    charmverse \[%{date("yyyy-MM-dd HH:mm:ss"):date}\]\s+%{word:level}: (\[%{notSpace:logger}\] )?%{regex("[^{]*"):message}%{data::json}
 * Resources for Datadog logging:
 *    Parsing rules: https://docs.datadoghq.com/logs/log_configuration/parsing/?tab=matchers#examples
 *    Mapping fields to log message and log level: https://docs.datadoghq.com/logs/log_configuration/processors/?tab=ui#log-status-remapper
 *    Best practices: https://docs.datadoghq.com/logs/guide/log-parsing-best-practice/
 */
const formatLogsForDocker = (isProdEnv || isStagingEnv) && isNodeEnv;

export function apply(log: Logger, logPrefix: string = '') {
  const defaultLevel = (process.env.LOG_LEVEL as LogLevelDesc) || log.levels.DEBUG;
  log.setDefaultLevel(defaultLevel);

  // dont apply logger in browser because it changes the stack tracke/line number
  if (isNodeEnv) {
    log.methodFactory = (methodName, logLevel, loggerName) => {
      const originalMethod = originalFactory(methodName, logLevel, loggerName);

      return (message, opt: unknown) => {
        const args = formatLog(message, opt, {
          formatLogsForDocker,
          isNodeEnv,
          logPrefix,
          methodName
        });
        originalMethod.apply(null, args);

        if (isProdEnv) {
          const args2 = formatLog(message, opt, {
            formatLogsForDocker: false,
            isNodeEnv: false,
            logPrefix,
            methodName
          });
          sendToDatadog(methodName, args2[0], args2[1]);
        }
      };
    };

    log.setLevel(log.getLevel()); // Be sure to call setLevel method in order to apply plugin
  }
  // send logs to Datadog in production from browser clients
  else if (enableDatadogLogs) {
    log.methodFactory = (methodName, logLevel, loggerName) => {
      const originalMethod = originalFactory(methodName, logLevel, loggerName);
      return (message, ...args) => {
        originalMethod.apply(null, [message, ...args]);
        const firstArg = args[0];
        const error = firstArg instanceof Error ? firstArg : (firstArg as any)?.error;
        datadogLogs.logger.log(message, firstArg, methodName as any, error);
      };
    };
    log.setLevel(log.getLevel()); // Be sure to call setLevel method in order to apply plugin
  }

  return log;
}

// log an error without calling Discord
function logErrorPlain(message: string, opts: any) {
  // eslint-disable-next-line no-console
  console.error(
    ...formatLog(message, opts, {
      formatLogsForDocker,
      isNodeEnv,
      methodName: 'error'
    })
  );
}
