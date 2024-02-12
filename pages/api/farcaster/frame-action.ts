import { ExternalServiceError, InvalidInputError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';
import type { ActionIndex, Frame, FrameButton } from 'frames.js';
import { getFrame } from 'frames.js';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { createFrameActionMessageWithSignerKey } from 'lib/farcaster/createFrameActionMessageWithSignerKey';
import { trackUserAction } from 'lib/metrics/mixpanel/trackUserAction';
import { onError, onNoMatch } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { decryptData } from 'lib/utilities/dataEncryption';
import { isValidUrl } from 'lib/utilities/isValidUrl';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.post(getNextFrame);

export type FrameActionResponse =
  | {
      location: string | null;
    }
  | {
      frame: Frame | null;
    };

export type FrameActionRequest = {
  privateKey: string;
  fid: number;
  postType: FrameButton['action'];
  pageId?: string;
  postUrl: string;
  buttonIndex: number;
  inputText: string;
};

const requestTimeout = 60000; // 1 minute

async function trackFarcasterFrameInteractionEvent({ pageId, userId }: { pageId: string; userId?: string }) {
  const space = await prisma.page.findUniqueOrThrow({
    where: {
      id: pageId
    },
    select: {
      createdBy: true,
      spaceId: true
    }
  });

  const spaceId = space.spaceId;
  trackUserAction('interact_farcaster_frame', {
    // userId is undefined on public pages
    userId: userId || space.createdBy,
    spaceId,
    pageId
  });
}

async function getNextFrame(req: NextApiRequest, res: NextApiResponse<FrameActionResponse>) {
  const { privateKey, buttonIndex, inputText, postUrl, fid, postType, pageId } = req.body as FrameActionRequest;
  const userId = req.session.user?.id;

  const castId = {
    fid,
    hash: new Uint8Array(Buffer.from('0000000000000000000000000000000000000000', 'hex'))
  };

  const { message, trustedBytes } = await createFrameActionMessageWithSignerKey(decryptData(privateKey) as string, {
    fid,
    buttonIndex,
    castId,
    url: Buffer.from(postUrl),
    inputText: Buffer.from(inputText)
  });

  if (!message) {
    throw new InvalidInputError('Error creating frame action message');
  }

  const fetchPromise = fetch(postUrl, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    redirect: postType === 'post_redirect' ? 'manual' : undefined,
    body: JSON.stringify({
      untrustedData: {
        fid,
        url: postUrl,
        messageHash: `0x${Buffer.from(message.hash).toString('hex')}`,
        timestamp: message.data.timestamp,
        network: 1,
        buttonIndex: Number(message.data.frameActionBody.buttonIndex) as ActionIndex,
        castId: {
          fid: castId.fid,
          hash: `0x${Buffer.from(castId.hash).toString('hex')}`
        },
        inputText
      },
      trustedData: {
        messageBytes: trustedBytes
      }
    })
  });

  const result = await Promise.race([
    fetchPromise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new ExternalServiceError('Request timed out')), requestTimeout);
    })
  ]);

  if (result instanceof Error) {
    throw result;
  }

  const response = result as Response;

  if (response.status === 302) {
    if (pageId) {
      trackFarcasterFrameInteractionEvent({ pageId, userId });
    }
    const location = response.headers.get('location');
    if (!location || !isValidUrl(location)) {
      throw new InvalidInputError('Invalid redirect URL');
    }
    return res.status(302).json({
      location: response.headers.get('location')
    });
  }

  const htmlString = await response.text();

  const { frame } = getFrame({ htmlString, url: postUrl });

  if (!frame) {
    throw new InvalidInputError('Invalid Farcaster frame URL');
  }

  if (pageId) {
    trackFarcasterFrameInteractionEvent({ pageId, userId });
  }

  return res.status(200).json({ frame });
}

export default withSessionRoute(handler);
