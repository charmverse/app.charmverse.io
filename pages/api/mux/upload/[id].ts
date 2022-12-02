import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireUser, ActionNotPermittedError } from 'lib/middleware';
import type { Upload } from 'lib/mux/getUpload';
import { getUpload } from 'lib/mux/getUpload';
import { computeUserPagePermissions } from 'lib/permissions/pages';
import { withSessionRoute } from 'lib/session/withSession';

export type UploadRequest = {
  pageId: string;
  id: string;
};

export type UploadResponse = Upload;

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).get(getUploadEndpoint);

async function getUploadEndpoint(req: NextApiRequest, res: NextApiResponse<UploadResponse>) {
  const query = req.query as UploadRequest;
  const pagePermissions = await computeUserPagePermissions({
    userId: req.session.user.id,
    pageId: query.pageId
  });

  if (!pagePermissions.edit_content) {
    throw new ActionNotPermittedError();
  }

  const upload = await getUpload(query.id);

  res.status(200).json(upload);
}

export default withSessionRoute(handler);
