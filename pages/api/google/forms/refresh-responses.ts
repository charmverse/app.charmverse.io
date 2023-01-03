import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { prisma } from 'db';
import { getCredentialMaybe } from 'lib/google/forms/credentials';
import { refreshResponses } from 'lib/google/forms/forms';
import log from 'lib/log';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { InvalidInputError } from 'lib/utilities/errors/errors';
import { WrongStateError } from 'lib/utilities/errors/invalidData';

export type RefreshFormsRequest = {
  boardId: string;
};

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).post(refreshResponsesResponse);

async function refreshResponsesResponse(req: NextApiRequest, res: NextApiResponse) {
  const boardId = req.query.boardId;

  if (typeof boardId !== 'string') {
    throw new InvalidInputError('Board id is required');
  }

  const block = await prisma.block.findUniqueOrThrow({ where: { id: boardId } });
  const fields = block.fields as any;
  const credentialId = fields.googleCredentialId;
  const googleFormId = fields.googleFormId;
  if (typeof credentialId !== 'string' || typeof googleFormId !== 'string') {
    throw new WrongStateError('Board is not set up to connect to Google');
  }
  const credential = await getCredentialMaybe({ credentialId });
  if (credential) {
    await refreshResponses({ googleFormId, credential });
  } else {
    log.warn('Could not find valid credentials to refresh form responses for board', {
      boardId,
      credentialId,
      googleFormId
    });
  }

  res.status(200).end();
}

export default withSessionRoute(handler);
