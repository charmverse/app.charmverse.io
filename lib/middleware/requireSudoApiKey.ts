import type { NextApiRequest, NextApiResponse } from 'next';
import type { NextHandler } from 'next-connect';

export function requireSudoApiKey(req: NextApiRequest, res: NextApiResponse, next: NextHandler) {
  const { sudoApiKey } = req.query;

  const currentSudoKey = process.env.SUDO_API_KEY;

  if (!currentSudoKey || !sudoApiKey || currentSudoKey.trim() !== (sudoApiKey as string).trim()) {
    return res.status(401).send({
      error: 'Please provide a valid sudo API Key'
    });
  }

  next();
}
