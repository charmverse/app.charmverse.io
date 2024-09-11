import { Card, Link, Typography, Stack } from '@mui/material';
import type { IframelyResponse } from '@root/lib/iframely/getIframely';

import { createCastParagraphChunks } from 'lib/feed/createCastParagraphChunks';
import type { Cast } from 'lib/feed/getFarcasterUserReactions';

import { CastAuthorDetails } from '../CastAuthorDetails';

import { CastEmbedContent } from './CastEmbedContent';
import { CastFrameContent } from './CastFrameContent';

export function CastContent({ cast, nested = false }: { nested?: boolean; cast: Cast }) {
  const castParagraphsChunks = createCastParagraphChunks(cast);

  const embeddedCasts: Cast[] = [];
  const embeddedImageUrls: string[] = [];
  const embeds: IframelyResponse[] = [];

  cast.embeds.forEach((embed) => {
    if ('cast_id' in embed && embed.cast_id.cast) {
      embeddedCasts.push(embed.cast_id.cast);
    }
  });

  cast.embeds.forEach((embed) => {
    if ('url' in embed && embed.metadata?.content_type?.startsWith('image')) {
      embeddedImageUrls.push(embed.url);
    }
  });

  cast.embeds.forEach((embed) => {
    if ('embed' in embed && embed.embed && embed.metadata?.content_type?.startsWith('image')) {
      embeds.push(embed.embed);
    }
  });

  return (
    <Stack gap={0.5}>
      {castParagraphsChunks.map((castParagraphChunks, paragraphIndex) => (
        <Typography key={`${paragraphIndex.toString()}`} component='p'>
          {castParagraphChunks.map((chunk, index) => {
            if (chunk.type === 'text') {
              return (
                <Typography
                  component='span'
                  key={`${index.toString()}`}
                  variant='body1'
                  sx={{
                    wordBreak: 'break-word'
                  }}
                >
                  {chunk.text}
                </Typography>
              );
            }
            if (chunk.type === 'mention') {
              return (
                <Link key={`${index.toString()}`} href={`https://warpcast.com/${chunk.text.slice(1)}`} target='_blank'>
                  <Typography
                    variant='body1'
                    component='span'
                    color='primary'
                    sx={{
                      wordBreak: 'break-word'
                    }}
                  >
                    {chunk.text}
                  </Typography>
                </Link>
              );
            }

            return (
              <Link key={`${index.toString()}`} href={chunk.text} target='_blank'>
                <Typography
                  variant='body1'
                  component='span'
                  color='primary'
                  sx={{
                    wordBreak: 'break-word',
                    display: 'block'
                  }}
                >
                  {chunk.text}
                </Typography>
              </Link>
            );
          })}
        </Typography>
      ))}

      {embeddedCasts.length && !nested ? (
        <Stack gap={1} my={1}>
          {embeddedCasts.map((embeddedCast) => (
            <Card key={embeddedCast.hash} sx={{ p: 2, display: 'flex', gap: 1 }}>
              <Stack gap={1}>
                <CastAuthorDetails cast={embeddedCast} />
                <CastContent nested cast={embeddedCast} />
              </Stack>
            </Card>
          ))}
        </Stack>
      ) : null}

      {embeddedImageUrls.length && !nested ? (
        <Stack gap={1} my={1}>
          {embeddedImageUrls.map((embeddedImageUrl) => (
            <img key={embeddedImageUrl} src={embeddedImageUrl} alt='Embedded' style={{ width: '100%' }} />
          ))}
        </Stack>
      ) : null}

      {embeds.length && !nested ? <CastEmbedContent embeds={embeds} /> : null}
      {cast.frames?.length && !nested ? <CastFrameContent frames={cast.frames} /> : null}
    </Stack>
  );
}
