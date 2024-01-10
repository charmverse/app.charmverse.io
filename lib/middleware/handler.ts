import { log } from '@charmverse/core/log';
import type { NextApiHandler, NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { count } from 'lib/metrics';
import { trackUserAction } from 'lib/metrics/mixpanel/trackUserAction';
import { ActionNotPermittedError, onError, onNoMatch } from 'lib/middleware';

export function defaultHandler() {
  return nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });
}
