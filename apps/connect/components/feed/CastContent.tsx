import { Typography, Card, Link } from '@mui/material';
import { Stack } from '@mui/system';
import { isTruthy } from '@root/lib/utils/types';

import { createCastParagraphChunks } from 'lib/feed/createCastParagraphChunks';
import type { Cast } from 'lib/feed/getFarcasterUserReactions';

import { CastAuthorDetails } from './CastAuthorDetails';

export function CastContent({ cast }: { cast: Cast }) {
  const castParagraphsChunks = createCastParagraphChunks(cast);

  const embeddedCasts = cast.embeds
    .filter((embed) => 'cast_id' in embed)
    .map((embed) => embed.cast_id.cast)
    .filter(isTruthy);

  return (
    <Stack gap={0.5}>
      {castParagraphsChunks.map((castParagraphChunks, paragraphIndex) => (
        <Typography key={`${paragraphIndex.toString()}`} component='p'>
          {castParagraphChunks.map((chunk, index) => {
            if (chunk.type === 'text') {
              return (
                <Typography component='span' key={`${index.toString()}`} variant='body1'>
                  {chunk.text}
                </Typography>
              );
            }
            if (chunk.type === 'mention') {
              return (
                <Link key={`${index.toString()}`} href={`https://warpcast.com/${chunk.text.slice(1)}`} target='_blank'>
                  <Typography variant='body1' component='span' color='primary'>
                    {chunk.text}
                  </Typography>
                </Link>
              );
            }

            return (
              <Link key={`${index.toString()}`} href={chunk.text} target='_blank'>
                <Typography variant='body1' component='p' color='primary'>
                  {chunk.text}
                </Typography>
              </Link>
            );
          })}
        </Typography>
      ))}

      {embeddedCasts.length ? (
        <Stack gap={1} my={1}>
          {embeddedCasts.map((embeddedCast) => (
            <Card key={embeddedCast.hash} sx={{ p: 2, display: 'flex', gap: 1 }}>
              <Stack gap={1}>
                <CastAuthorDetails cast={embeddedCast} />
                <CastContent cast={embeddedCast} />
              </Stack>
            </Card>
          ))}
        </Stack>
      ) : null}
    </Stack>
  );
}
