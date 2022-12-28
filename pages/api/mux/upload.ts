import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { createUpload } from 'lib/mux/createUpload';
import { withSessionRoute } from 'lib/session/withSession';

export type CreateUploadRequest = {
  pageId: string;
};

export type CreateUploadResponse = {
  id: string;
  url: string;
};

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).post(createUploadEndpoint);

async function createUploadEndpoint(req: NextApiRequest, res: NextApiResponse<CreateUploadResponse>) {
  const result = await createUpload();

  res.status(200).json(result);
}

export default withSessionRoute(handler);
