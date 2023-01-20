import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireUser, ActionNotPermittedError } from 'lib/middleware';
import type { Upload } from 'lib/mux/getUpload';
import { getUpload } from 'lib/mux/getUpload';
import { canCreate } from 'lib/mux/permissions';
import { withSessionRoute } from 'lib/session/withSession';
import { hasAccessToSpace } from 'lib/users/hasAccessToSpace';

export type UploadRequest = {
  pageId: string | null;
  id: string;
  spaceId: string;
};

export type UploadResponse = Upload;

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).get(getUploadEndpoint);

async function getUploadEndpoint(req: NextApiRequest, res: NextApiResponse<UploadResponse>) {
  const query = req.query as UploadRequest;
  const userId = req.session.user.id;

  if (!query.pageId) {
    const hasAccess = await hasAccessToSpace({
      userId,
      spaceId: query.spaceId
    });

    if (!hasAccess) {
      throw new ActionNotPermittedError();
    }

    const upload = await getUpload(query.id);
    return res.status(200).json(upload);
  }

  const isAllowed = await canCreate({
    userId,
    resourceId: query.pageId,
    spaceId: query.spaceId
  });

  if (!isAllowed) {
    throw new ActionNotPermittedError();
  }

  const upload = await getUpload(query.id);

  res.status(200).json(upload);
}

export default withSessionRoute(handler);
