import type { NextApiRequest } from 'next';

export function getRequestLanguage(req: NextApiRequest) {
  const { headers } = req;
  const langStr = headers['accept-language'] ?? '';

  return langStr.split(',')[0] || 'en-US';
}
