import type { Frame } from 'frames.js';
import { getFrame } from 'frames.js';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import * as http from 'adapters/http';
import { onError, onNoMatch, requireKeys } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireKeys([{ key: 'frameUrl', valueType: 'string' }], 'query')).get(extractFarcasterMetadataFromUrl);

async function extractFarcasterMetadataFromUrl(req: NextApiRequest, res: NextApiResponse<Frame | null>) {
  const frameUrl = req.query.frameUrl as string;
  const unparsedFrameHtml = await http.GET<string>(frameUrl);
  const frame = getFrame({
    htmlString: unparsedFrameHtml,
    url: frameUrl
  });

  if (!frame) {
    return null;
  }

  return res.status(200).json(frame);
}

export default withSessionRoute(handler);
