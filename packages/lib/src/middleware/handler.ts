import { onError, onNoMatch } from '@packages/lib/middleware';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

export function defaultHandler() {
  return nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });
}
