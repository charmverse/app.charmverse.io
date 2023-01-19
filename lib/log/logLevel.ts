import type { Logger, LogLevelDesc } from 'loglevel';
import _log from 'loglevel';
import { DateTime } from 'luxon';

import * as http from 'adapters/http';
import { isNodeEnv, isProdEnv, isStagingEnv } from 'config/constants';

const TIMESTAMP_FORMAT = 'yyyy-LL-dd HH:mm:ss';
const ERRORS_WEBHOOK = process.env.NEXT_PUBLIC_DISCORD_WEBHOOK_ERRORS;
const originalFactory = _log.methodFactory;

type LogMeta = {
  data?: any;
  error?: { message: string; code?: number; stack?: string };
};

/**
 * Enable formatting special logs for Datadog in production
 * Example:
 *    charmverse \[%{date("yyyy-MM-dd HH:mm:ss"):date}\]\s+%{word:level}: (\[%{notSpace:logger}\] )?%{regex("[^{]*"):message}%{data::json}
 * Resources for Datadog logging:
 *    Parsing rules: https://docs.datadoghq.com/logs/log_configuration/parsing/?tab=matchers#examples
 *    Mapping fields to log message and log level: https://docs.datadoghq.com/logs/log_configuration/processors/?tab=ui#log-status-remapper
 *    Best practices: https://docs.datadoghq.com/logs/guide/log-parsing-best-practice/
 */
const formatLogsForDatadog = (isProdEnv || isStagingEnv) && isNodeEnv;

export function apply(log: Logger, logPrefix: string = '') {
  const defaultLevel = (process.env.LOG_LEVEL as LogLevelDesc) || log.levels.DEBUG;
  log.setDefaultLevel(defaultLevel);

  // dont apply logger in browser because it changes the stack tracke/line number
  if (isNodeEnv) {
    log.methodFactory = (methodName, logLevel, loggerName) => {
      const originalMethod = originalFactory(methodName, logLevel, loggerName);

      return (message, opt: unknown) => {
        let prefix = '';
        if (formatLogsForDatadog) {
          prefix = `[${DateTime.local().toFormat(TIMESTAMP_FORMAT)}]`;
        }
        if (isNodeEnv) {
          prefix += `${prefix ? ' ' : ''}${methodName}:`;
        }
        if (logPrefix) {
          prefix += `${prefix ? ' ' : ''}[${logPrefix}]`;
        }
        if (prefix) {
          prefix += ' ';
        }

        let args: any[];
        if (formatLogsForDatadog) {
          // extract information from errors, and ensure that opts is always a JSON-serializable object
          let _opt: LogMeta = {};
          if (opt) {
            let error: LogMeta['error'];
            const maybeError = (opt as { error?: Error }).error || opt;
            if (maybeError instanceof Error) {
              error = { ...maybeError, message: maybeError.message, stack: maybeError.stack };
            }
            if (isPrimitiveValue(opt) || opt instanceof Array) {
              _opt = { data: opt };
            } else {
              try {
                _opt = { ...opt };
              } catch (e) {
                _opt = { data: opt };
              }
            }
            _opt.error = error;
          }
          // TODO: try adding datadog trace info to logs, it wont build with webpack though
          // const span = tracer.scope().active();
          // if (span) {
          //   tracer.inject(span.context(), formats.LOG, _opt);
          // }
          args = [`${prefix}${message} ${JSON.stringify(_opt)}`];
        } else {
          args = opt ? [`${prefix}${message}`, opt] : [`${prefix}${message}`];
        }
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

// Check if value is primitive value
function isPrimitiveValue(value: unknown): boolean {
  return (
    typeof value === 'symbol' ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    typeof value === 'undefined' ||
    value === null ||
    typeof value === 'bigint'
  );
}
