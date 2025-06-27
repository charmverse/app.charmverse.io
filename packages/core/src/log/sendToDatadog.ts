/* eslint-disable no-console */
import { _isPrimitiveValue, type LogMeta } from './logUtils';

type DatadogLogPayload = {
  message: string;
  level: string;
  timestamp: number;
  context?: string;
  data?: any;
  service: string;
  ddsource: string;
  ddtags: string;
};

const env = process.env.REACT_APP_APP_ENV || process.env.NODE_ENV || 'unknown';
const service = process.env.SERVICE_NAME || 'unknown';

const ddtags = `env:${env}`;

export async function sendToDatadog(level: string, log: string, context?: any) {
  if (!process.env.DD_API_KEY) {
    return;
  }

  let error: LogMeta['error'] = (context as LogMeta | undefined)?.error;
  const maybeError = (context as { error?: Error })?.error || context;
  if (maybeError instanceof Error) {
    error = { ...maybeError, message: maybeError.message, stack: maybeError.stack };
  }
  if (_isPrimitiveValue(context) || context instanceof Array) {
    context = { data: context };
  }

  const logItem: DatadogLogPayload = {
    ddsource: 'nodejs',
    ...context,
    message: log,
    error,
    hostName: process.env.HOSTNAME, // defined in beanstalk
    service,
    ddtags,
    level,
    timestamp: Date.now()
  };

  const response = await fetch('https://http-intake.logs.datadoghq.com/api/v2/logs', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'DD-API-KEY': process.env.DD_API_KEY
    },
    body: JSON.stringify(logItem)
  });
  if (!response.ok) {
    console.error(`Error sending log to Datadog: ${response.status} - ${response.statusText}`);
  }
}
