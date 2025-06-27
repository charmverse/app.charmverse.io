import type { SystemError } from '@packages/core/errors';

const validationProps: (keyof SystemError)[] = ['errorType', 'message', 'severity', 'code'];

export function isSystemError(err: any): err is SystemError {
  return (
    validationProps.every((prop) => !!err[prop]) && typeof err.code === 'number' && err.code >= 400 && err.code <= 599
  );
}
