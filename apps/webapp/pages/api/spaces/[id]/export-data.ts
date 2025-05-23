import { onError, onNoMatch, requireSpaceMembership } from '@packages/lib/middleware';
import { withSessionRoute } from '@packages/lib/session/withSession';
import { createDataExport } from '@packages/spaces/export/createDataExport';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.post(requireSpaceMembership({ adminOnly: true, spaceIdKey: 'id' }), requestZip);

async function requestZip(req: NextApiRequest, res: NextApiResponse) {
  const downloadLink = await createDataExport({ spaceId: req.query.id as string, userId: req.session.user?.id });

  return res.status(200).send({ downloadLink });
}

export default withSessionRoute(handler);
