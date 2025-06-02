import { prisma } from '@charmverse/core/prisma-client';
import { onError, onNoMatch, requireUser } from '@packages/lib/middleware';
import { createUpload } from '@packages/lib/mux/createUpload';
import { withSessionRoute } from '@packages/lib/session/withSession';
import { ActionNotPermittedError } from '@packages/nextjs/errors';
import { getVideoSizeLimit } from '@packages/subscriptions/featureRestrictions';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

export type CreateUploadRequest = {
  pageId: string;
  spaceId: string;
  fileSize: number;
};

export type CreateUploadResponse = {
  id: string;
  url: string;
};

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).post(createUploadEndpoint);

async function createUploadEndpoint(req: NextApiRequest, res: NextApiResponse<CreateUploadResponse>) {
  const { spaceId, fileSize } = req.body as CreateUploadRequest;

  // Get space subscription tier
  const space = await prisma.space.findUnique({
    where: { id: spaceId },
    select: { subscriptionTier: true }
  });

  if (!space) {
    throw new ActionNotPermittedError();
  }

  const sizeLimit = getVideoSizeLimit(space.subscriptionTier);

  if (fileSize > sizeLimit) {
    throw new ActionNotPermittedError(`Video size exceeds the limit for your subscription tier`);
  }

  const result = await createUpload();
  res.status(200).json(result);
}

export default withSessionRoute(handler);
