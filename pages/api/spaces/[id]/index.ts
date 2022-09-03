
import { Space } from '@prisma/client';
import { prisma } from 'db';
import { onError, onNoMatch, requireSpaceMembership, ActionNotPermittedError } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler
  .use(requireSpaceMembership({ adminOnly: true, spaceIdKey: 'id' }))
  .put(updateSpace)
  .delete(deleteSpace);

async function updateSpace (req: NextApiRequest, res: NextApiResponse<Space>) {

  const spaceDomain = req.body.domain as string | undefined;

  const existing = (typeof spaceDomain === 'string') ? await prisma.space.findFirst({
    where: {
      domain: spaceDomain
    }
  }) : null;

  if (existing && existing.id !== req.query.id) {
    throw new ActionNotPermittedError('This domain is already in use');
  }

  const space = await prisma.space.update({
    where: {
      id: req.query.id as string
    },
    data: req.body
  });
  return res.status(200).json(space);
}

async function deleteSpace (req: NextApiRequest, res: NextApiResponse) {
  await prisma.space.delete({
    where: {
      id: req.query.id as string
    }
  });
  return res.status(200).json({ ok: true });
}

export default withSessionRoute(handler);
