import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { prisma } from 'db';
import type { BoardViewFields } from 'lib/focalboard/boardView';
import { syncFormResponses } from 'lib/google/forms/syncFormResponses';
import log from 'lib/log';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { InvalidInputError } from 'lib/utilities/errors/errors';
import { WrongStateError } from 'lib/utilities/errors/invalidData';

export type RefreshFormsRequest = {
  boardId: string;
};

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).post(syncResponsesResponse);

async function syncResponsesResponse(req: NextApiRequest, res: NextApiResponse) {
  const boardId = req.query.boardId;

  if (typeof boardId !== 'string') {
    throw new InvalidInputError('Board id is required');
  }

  const block = await prisma.block.findUniqueOrThrow({ where: { id: boardId } });
  const fields = block.fields as BoardViewFields;
  const sourceData = fields.sourceData;
  if (!sourceData) {
    throw new WrongStateError('Board is not set up to connect to Google');
  }

  await syncFormResponses({ sourceData });

  res.status(200).end();
}

export default withSessionRoute(handler);
