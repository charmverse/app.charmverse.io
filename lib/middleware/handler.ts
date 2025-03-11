import { onError, onNoMatch } from '@root/lib/middleware';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

export function defaultHandler() {
  return nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });
}
