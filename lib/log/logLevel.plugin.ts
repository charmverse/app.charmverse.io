import type { Logger, LogLevelDesc } from 'loglevel';
import _log from 'loglevel';
import { DateTime } from 'luxon';

import * as http from 'adapters/http';
import { isProdEnv } from 'config/constants';

const TIMESTAMP_FORMAT = 'yyyy-LL-dd HH:mm:ss';
const ERRORS_WEBHOOK = process.env.NEXT_PUBLIC_DISCORD_WEBHOOK_ERRORS;
const originalFactory = _log.methodFactory;

export function apply (log: Logger) {

  const defaultLevel = (process.env.LOG_LEVEL as LogLevelDesc) || (isProdEnv ? 'debug' : 'debug');
  log.setDefaultLevel(defaultLevel);

  // add timestamps and send errors to Slack channel in production
  if (isProdEnv && ERRORS_WEBHOOK) {

    log.methodFactory = (methodName, logLevel, loggerName) => {
      const rawMethod = originalFactory(methodName, logLevel, loggerName);
      return (message, opt) => {

        const timestamp = DateTime.local().toFormat(TIMESTAMP_FORMAT);

        if (opt) {
          rawMethod(`[${timestamp}] ${methodName}: ${message}`, opt);
        }
        else {
          rawMethod(`[${timestamp}] ${methodName}: ${message}`);
        }

        // post errors to Discord
        if (methodName === 'error') {
          sendErrorToDiscord(ERRORS_WEBHOOK, message, opt)
            .catch(err => {
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

function sendErrorToDiscord (webhook: string, message: any, opt: any) {
  let fields: { name: string, value?: string }[] = [];
  if (opt instanceof Error) {
    fields = [
      { name: 'Error', value: opt.message },
      { name: 'Stacktrace', value: opt.stack?.slice(0, 500) }
    ];
  }
  else if (opt) {
    fields = Object.entries<any>(opt).map(([name, _value]) => {
      const value = typeof _value === 'string' ? _value.slice(0, 500) : JSON.stringify(_value || {});
      return { name, value };
    })
      .slice(0, 5); // add a sane max # of fields just in case
  }
  return http.POST(webhook, {
    embeds: [{
      color: 14362664, // #db2828
      description: message,
      fields
    }]
  });
}
