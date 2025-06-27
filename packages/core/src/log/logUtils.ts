import { DateTime } from 'luxon';

export const TIMESTAMP_FORMAT = 'yyyy-LL-dd HH:mm:ss';

export type LogMeta = {
  data?: any;
  error?: { message: string; code?: number; stack?: string };
};

export function formatLog(
  message: string,
  opt: unknown,
  {
    formatLogsForDocker,
    now = DateTime.local(),
    isNodeEnv,
    logPrefix,
    methodName
  }: { now?: DateTime; formatLogsForDocker?: boolean; isNodeEnv?: boolean; logPrefix?: string; methodName: string }
) {
  let prefix = '';
  if (formatLogsForDocker) {
    prefix = `[${formatTime(now)}]`;
  }
  if (isNodeEnv ?? formatLogsForDocker) {
    prefix += `${prefix ? ' ' : ''}${methodName}:`;
  }
  if (logPrefix) {
    prefix += `${prefix ? ' ' : ''}[${logPrefix}]`;
  }
  if (prefix) {
    prefix += ' ';
  }

  let args: any[];
  if (formatLogsForDocker) {
    // extract information from errors, and ensure that opts is always a JSON-serializable object
    let _opt: LogMeta = {};
    if (opt) {
      let error: LogMeta['error'] = (opt as LogMeta).error;
      const maybeError = (opt as { error?: Error }).error || opt;
      if (maybeError instanceof Error) {
        error = { ...maybeError, message: maybeError.message, stack: maybeError.stack };
      }
      if (_isPrimitiveValue(opt) || opt instanceof Array) {
        _opt = { data: opt };
      } else {
        _opt = { ...(opt as object) };
      }
      _opt.error = error;
    }
    // TODO: try adding datadog trace info to logs, it wont build with webpack though
    // const span = tracer.scope().active();
    // if (span) {
    //   tracer.inject(span.context(), formats.LOG, _opt);
    // }
    args = [opt ? `${prefix}${message} ${JSON.stringify(_opt)}` : `${prefix}${message}`];
  } else {
    args = opt ? [`${prefix}${message}`, opt] : [`${prefix}${message}`];
  }
  return args;
}

export function formatTime(date: DateTime) {
  return date.toFormat(TIMESTAMP_FORMAT);
}

// Check if value is primitive value
export function _isPrimitiveValue(value: unknown): boolean {
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
