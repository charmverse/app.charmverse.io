import type { TextOnlyMetadata } from '@lens-protocol/metadata';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { uploadToArweave } from '@packages/lib/lens/uploadToArweave';
import { onError, onNoMatch } from '@packages/lib/middleware';
import { withSessionRoute } from '@packages/lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.post(uploadToArweaveController);

async function uploadToArweaveController(req: NextApiRequest, res: NextApiResponse<string | null>) {
  const { metadata } = req.body as { metadata: TextOnlyMetadata };
  const uri = await uploadToArweave(metadata);

  return res.status(200).json(uri);
}

export default withSessionRoute(handler);
