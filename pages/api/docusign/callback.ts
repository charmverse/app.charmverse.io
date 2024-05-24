import { hasAccessToSpace } from '@charmverse/core/permissions';
import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { decodeDocusignState, saveUserDocusignOAuthToken } from 'lib/docusign/authentication';
import { ensureSpaceWebhookExists } from 'lib/docusign/connect';
import { ActionNotPermittedError, onError, onNoMatch } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.get(docusignCallback);

async function docusignCallback(req: NextApiRequest, res: NextApiResponse) {
  const sealedSpaceId = req.query.state as string;

  const state = await decodeDocusignState(sealedSpaceId);

  const { spaceRole } = await hasAccessToSpace({
    spaceId: state.spaceId,
    userId: state.userId
  });

  if (!spaceRole?.isAdmin) {
    throw new ActionNotPermittedError('Only admins can connect Docusign');
  }

  const credentials = await saveUserDocusignOAuthToken({
    code: req.query.code as string,
    spaceId: state.spaceId,
    userId: state.userId
  });

  await ensureSpaceWebhookExists({ spaceId: credentials.spaceId, credentials });

  const space = await prisma.space.findUniqueOrThrow({
    where: {
      id: credentials.spaceId
    },
    select: {
      domain: true
    }
  });

  return res.status(302).redirect(`/${space.domain}`);
}

export default withSessionRoute(handler);
