import { InvalidInputError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';
import { stringUtils } from '@charmverse/core/utilities';
import { unsealData } from 'iron-session';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { authSecret } from 'config/constants';
import { saveUserDocusignOAuthToken } from 'lib/docusign/authentication';
import { ensureSpaceWebhookExists } from 'lib/docusign/connect';
import { onError, onNoMatch } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.get(docusignCallback);

async function docusignCallback(req: NextApiRequest, res: NextApiResponse) {
  const sealedSpaceId = req.query.state as string;

  const spaceId = await unsealData<string>(sealedSpaceId, { password: authSecret as string });

  if (!stringUtils.isUUID(spaceId)) {
    throw new InvalidInputError('Could not decrypt spaceId in docusign callback');
  }

  const credentials = await saveUserDocusignOAuthToken({
    code: req.query.code as string,
    spaceId,
    userId: req.session.user.id
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
