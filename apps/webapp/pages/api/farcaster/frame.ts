import { prisma } from '@charmverse/core/prisma-client';
import * as http from '@packages/adapters/http';
import { InvalidInputError } from '@packages/core/errors';
import { onError, onNoMatch, requireKeys } from '@packages/lib/middleware';
import { withSessionRoute } from '@packages/lib/session/withSession';
import { trackUserAction } from '@packages/metrics/mixpanel/trackUserAction';
import type { Frame } from 'frames.js';
import { getFrame } from 'frames.js';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireKeys([{ key: 'frameUrl', valueType: 'string' }], 'query')).get(extractFarcasterMetadataFromUrl);

async function extractFarcasterMetadataFromUrl(
  req: NextApiRequest,
  res: NextApiResponse<Frame | Partial<Frame> | null | { error: string }>
) {
  const userId = req.session.user?.id;
  const frameUrl = req.query.frameUrl as string;
  const pageId = req.query.pageId as string | undefined;
  const localhostUrl = isLocalhostUrl(frameUrl);
  if (localhostUrl) {
    throw new InvalidInputError('Invalid Farcaster frame URL');
  }
  const unparsedFrameHtml = await http.GET<string>(frameUrl);
  const { frame } = await getFrame({
    htmlString: unparsedFrameHtml,
    frameUrl,
    url: frameUrl
  });

  if (!frame) {
    throw new InvalidInputError('Invalid Farcaster frame URL');
  }

  const frameImage = (frame as Frame).image;

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

function isLocalhostUrl(text: string) {
  return /^https?:\/\/(localhost|0|10|127|192(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}|\[::1?\])/gi.test(text);
}
export default withSessionRoute(handler);
