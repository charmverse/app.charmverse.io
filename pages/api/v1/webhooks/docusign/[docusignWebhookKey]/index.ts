import { prisma } from '@charmverse/core/dist/cjs/prisma-client';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireUser } from 'lib/middleware';
import type { NextApiRequestWithApiPageKey } from 'lib/middleware/requireApiPageKey';
import { permissionsApiClient } from 'lib/permissions/api/client';
import type { PageProperty } from 'lib/public-api';
import { createDatabaseCardPage } from 'lib/public-api';
import { getDatabaseWithSchema } from 'lib/public-api/getDatabaseWithSchema';
import { apiPageKeyHandler } from 'lib/public-api/handler';
import { updateDatabaseSchema } from 'lib/public-api/updateDatabaseSchema';
import type { BodyFormResponse, TypeformResponse } from 'lib/typeform/interfaces';
import { simplifyTypeformResponse } from 'lib/typeform/simplifyTypeformResponse';
import { transformWebhookBodyFormResponse } from 'lib/typeform/transformWebhookBodyFormResponse';
import { InvalidInputError } from 'lib/utils/errors';
import { prettyPrint } from 'lib/utils/strings';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.post(docusignEventHandler);

export async function docusignEventHandler(req: NextApiRequestWithApiPageKey, res: NextApiResponse) {
  const docusignKey = req.query.docusignWebhookKey as string;

  const space = await prisma.docusignCredential.findUnique({
    where: {
      spaceDocusignApiKey: docusignKey
    }
  });

  prettyPrint({
    space,
    event: req.body
  });

  return res.status(200).json({ success: true });
}

export default handler;
