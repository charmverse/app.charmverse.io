import type { Logger, LogLevelDesc } from 'loglevel';
import _log from 'loglevel';

import * as http from 'adapters/http';
import { isNodeEnv, isProdEnv, isStagingEnv } from 'config/constants';

import { formatLog } from './logUtils';

const ERRORS_WEBHOOK = process.env.NEXT_PUBLIC_DISCORD_WEBHOOK_ERRORS;
const originalFactory = _log.methodFactory;

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

        // post errors to Discord
        if (isProdEnv && methodName === 'error' && ERRORS_WEBHOOK) {
          sendErrorToDiscord(ERRORS_WEBHOOK, message, opt).catch((err) => {
            // eslint-disable-next-line no-console
            console.error('Error posting to discord', err);
          });
        }
      };
    };

    log.setLevel(log.getLevel()); // Be sure to call setLevel method in order to apply plugin
  }

  return log;
}

function sendErrorToDiscord(webhook: string, message: any, opt: any) {
  let fields: { name: string; value?: string }[] = [];
  if (opt instanceof Error) {
    fields = [
      { name: 'Error', value: opt.message },
      { name: 'Stacktrace', value: opt.stack?.slice(0, 500) }
    ];
  } else if (opt) {
    fields = Object.entries<any>(opt)
      .map(([name, _value]) => {
        const value = typeof _value === 'string' ? _value.slice(0, 500) : JSON.stringify(_value || {});
        return { name, value };
      })
      .slice(0, 5); // add a sane max # of fields just in case
  }
  return http.POST(webhook, {
    embeds: [
      {
        color: 14362664, // #db2828
        description: message,
        fields
      }
    ]
  });
}
