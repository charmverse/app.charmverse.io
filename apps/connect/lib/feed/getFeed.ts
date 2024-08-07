import type { IframelyResponse } from '@root/lib/iframely/getIframely';
import { getIframely } from '@root/lib/iframely/getIframely';
import type { Cast } from '@root/lib/neynar/interfaces';
import { isTruthy } from '@root/lib/utils/types';
import { uniqBy } from 'lodash';

import { getEmbeddedCasts } from './getEmbeddedCasts';
import { getFarcasterUserCasts } from './getFarcasterUserCasts';
import { getFarcasterUserReactions } from './getFarcasterUserReactions';

export type FeedItem = { type: 'recast' | 'like' | 'cast'; cast: Cast; hash: string };

const charmverseFarcasterId = 1501;

export async function getFeed(): Promise<FeedItem[]> {
  const userReactions = await getFarcasterUserReactions({
    fid: charmverseFarcasterId
  });
  const userCasts = await getFarcasterUserCasts({
    fid: charmverseFarcasterId
  });

  const feedItems = uniqBy(
    [
      ...userReactions.map(
        (reaction): FeedItem => ({ type: reaction.reaction_type, cast: reaction.cast, hash: reaction.cast.hash })
      ),
      ...userCasts.map((cast): FeedItem => ({ type: 'cast', cast, hash: cast.hash }))
    ],
    'hash'
  ).sort((a, b) => new Date(b.cast.timestamp).getTime() - new Date(a.cast.timestamp).getTime());

  const embeddedCasts = await getEmbeddedCasts({
    casts: feedItems.map((item) => item.cast)
  });

  const embeddedFramesRecord = (
    await Promise.all(
      feedItems
        .map((feedItem) => feedItem.cast.embeds.map((embed) => ('url' in embed ? embed.url : null)).filter(isTruthy))
        .flat()
        .map((url) => getIframely({ url, darkMode: 'dark' }))
    )
  ).reduce((acc, frame) => {
    acc[frame.url] = frame;
    return acc;
  }, {} as Record<string, IframelyResponse>);

  return feedItems.map((feedItem) => ({
    ...feedItem,
    cast: {
      ...feedItem.cast,
      embeds: feedItem.cast.embeds.map((embed) => {
        if ('cast_id' in embed) {
          return {
            cast_id: {
              ...embed.cast_id,
              cast: embeddedCasts.find((cast) => cast.hash === embed.cast_id.hash)!
            }
          };
        } else if (embed.url in embeddedFramesRecord) {
          return {
            ...embed,
            frame: embeddedFramesRecord[embed.url]
          };
        }
        return embed;
      })
    }
  }));
}
