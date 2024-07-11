import { InvalidInputError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';
import type { Frame } from 'frames.js';
import { getFrame } from 'frames.js';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import * as http from '@root/adapters/http';
import { trackUserAction } from 'lib/metrics/mixpanel/trackUserAction';
import { onError, onNoMatch, requireKeys } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { isLocalhostUrl } from 'lib/utils/strings';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireKeys([{ key: 'frameUrl', valueType: 'string' }], 'query')).get(extractFarcasterMetadataFromUrl);

async function extractFarcasterMetadataFromUrl(
  req: NextApiRequest,
  res: NextApiResponse<Frame | null | { error: string }>
) {
  const userId = req.session.user?.id;
  const frameUrl = req.query.frameUrl as string;
  const pageId = req.query.pageId as string | undefined;
  const localhostUrl = isLocalhostUrl(frameUrl);
  if (localhostUrl) {
    throw new InvalidInputError('Invalid Farcaster frame URL');
  }
  const unparsedFrameHtml = await http.GET<string>(frameUrl);
  const { frame } = getFrame({
    htmlString: unparsedFrameHtml,
    url: frameUrl
  });

  if (!frame) {
    throw new InvalidInputError('Invalid Farcaster frame URL');
  }

  const frameImage = frame.image;

  if (frameImage && frameImage.includes('svg')) {
    throw new InvalidInputError('Invalid Farcaster frame URL');
  }

  if (pageId) {
    const space = await prisma.page.findUniqueOrThrow({
      where: {
        id: pageId
      },
      select: {
        spaceId: true
      }
    });

    const spaceId = space.spaceId;
    trackUserAction('view_farcaster_frame', {
      userId,
      spaceId,
      pageId,
      frameUrl
    });
  }

  return res.status(200).json(frame);
}

export default withSessionRoute(handler);
