import { log } from '@packages/core/log';
import { gauge, count } from '@packages/metrics';
import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json({ health: 'ok' });
}

// need to add a router to this.
export function testDDGauge(req: NextApiRequest, res: NextApiResponse) {
  gauge('health.dd.gauge', 99);
  res.status(200).json({ gauge: 'sent 99 as gauge' });
}

export function testDDCount(req: NextApiRequest, res: NextApiResponse) {
  count('health.dd.count', 1);
  res.status(200).json({ count: 'adding 1 to count' });
}
