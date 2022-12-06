import logBase from 'loglevel';

import { apply } from './logLevel';

// create a log instance with a special prefix. Example: `[mailer] `
export function getLogger(_prefix: string) {
  const log = logBase.getLogger(Symbol(_prefix));
  return apply(log, _prefix);
}
