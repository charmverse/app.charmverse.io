import { log } from '@charmverse/core/log';
import { count } from '@root/lib/metrics';
import { trackUserAction } from '@root/lib/metrics/mixpanel/trackUserAction';
import { ActionNotPermittedError, onError, onNoMatch } from '@root/lib/middleware';
import type { NextApiHandler, NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

export function defaultHandler() {
  return nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });
}
