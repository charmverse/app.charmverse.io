import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireUser, ActionNotPermittedError } from 'lib/middleware';
import { createUpload } from 'lib/mux/createUpload';
import { computeUserPagePermissions } from 'lib/permissions/pages';
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
  const query = req.query as CreateUploadRequest;
  const pagePermissions = await computeUserPagePermissions({
    userId: req.session.user.id,
    pageId: query.pageId
  });

  if (!pagePermissions.edit_content) {
    throw new ActionNotPermittedError();
  }

  const result = await createUpload();

  res.status(200).json(result);
}

export default withSessionRoute(handler);
