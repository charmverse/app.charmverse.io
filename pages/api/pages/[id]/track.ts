import { prisma } from 'db';
import { ActionNotPermittedError, onError, onNoMatch, requireUser } from 'lib/middleware';
import { computeUserPagePermissions } from 'lib/permissions/pages';
import { withSessionRoute } from 'lib/session/withSession';
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser)
  .post(trackChanges);

async function trackChanges (req: NextApiRequest, res: NextApiResponse) {
  const pageId = req.query.id as string;
  const userId = req.session.user.id;
  const { suggestion } = req.body as {suggestion: string};

  const permissions = await computeUserPagePermissions({
    pageId,
    userId
  });

  if (permissions.edit_content !== true) {
    throw new ActionNotPermittedError('You are not allowed to edit this page.');
  }

  await prisma.documentSuggestion.upsert({
    where: {
      pageId
    },
    create: {
      pageId,
      suggestion
    },
    update: {
      suggestion
    }
  });

  return res.status(200).json({ ok: null });
}

export default withSessionRoute(handler);
