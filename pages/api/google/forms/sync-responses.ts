import { prisma } from '@charmverse/core/prisma-client';
import { UnauthorisedActionError, InvalidInputError } from '@packages/utils/errors';
import { GaxiosError } from 'gaxios';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { invalidateCredential } from 'lib/google/authorization/credentials';
import { syncFormResponses } from 'lib/google/forms/syncFormResponses';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';

export type RefreshFormsRequest = {
  reset?: boolean;
  viewId: string;
};

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).post(syncResponsesResponse);

async function syncResponsesResponse(req: NextApiRequest, res: NextApiResponse) {
  const { reset, viewId } = req.body;

  if (typeof viewId !== 'string') {
    throw new InvalidInputError('View id is required');
  }

  const view = await prisma.block.findUniqueOrThrow({ where: { id: viewId } });

  try {
    await syncFormResponses({ createdBy: req.session.user.id, view, reset });
  } catch (error) {
    if (error instanceof GaxiosError) {
      await invalidateCredential({
        credentialId: (view.fields as any)?.sourceData.credentialId,
        error: error.response?.data.error
      });
      throw new UnauthorisedActionError('Invalid credentials');
    }
  }

  res.status(200).end();
}

export default withSessionRoute(handler);
