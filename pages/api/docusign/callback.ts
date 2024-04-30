import { prisma } from '@charmverse/core/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { saveUserDocusignOAuthToken } from 'lib/docusign/authentication';
import { onError, onNoMatch } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.get(docusignCallback);

async function docusignCallback(req: NextApiRequest, res: NextApiResponse) {
  const credentials = await saveUserDocusignOAuthToken({
    code: req.query.code as string,
    spaceId: req.query.state as string,
    userId: req.session.user.id
  });

  const space = await prisma.space.findUniqueOrThrow({
    where: {
      id: credentials.spaceId
    },
    select: {
      domain: true
    }
  });

  return res.status(302).redirect(`/${space.domain}/sign-docs`);
}

export default withSessionRoute(handler);
