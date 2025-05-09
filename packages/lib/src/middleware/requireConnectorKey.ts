import { ActionNotPermittedError } from '@packages/nextjs/errors';
import type { NextApiRequest, NextApiResponse } from 'next';
import type { NextHandler } from 'next-connect';

const key = process.env.CONNECTOR_KEY;
/**
 * Check for a valid space level API token, and ensure the operation is taking place only in the target space
 *
 * assigns authorizedSpaceId so follow-on endpoints can use it
 */
export async function requireConnectorKey(req: NextApiRequest, res: NextApiResponse, next: NextHandler) {
  if (!key || req.headers.authorization !== `Bearer ${key}`) {
    throw new ActionNotPermittedError('Invalid connector key');
  }

  next();
}
