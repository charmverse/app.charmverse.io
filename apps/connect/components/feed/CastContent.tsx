import { Typography, Card, Link, CardActionArea } from '@mui/material';
import { Stack } from '@mui/system';
import { isTruthy } from '@root/lib/utils/types';

import { createCastParagraphChunks } from 'lib/feed/createCastParagraphChunks';
import type { Cast } from 'lib/feed/getFarcasterUserReactions';

import { CastAuthorDetails } from './CastAuthorDetails';

export function CastContent({ cast, nested = false }: { nested?: boolean; cast: Cast }) {
  const castParagraphsChunks = createCastParagraphChunks(cast);

  const embeddedCasts = cast.embeds
    .filter((embed) => 'cast_id' in embed)
    .map((embed) => embed.cast_id.cast)
    .filter(isTruthy);

  const embeddedImageUrls = cast.embeds
    .filter((embed) => 'url' in embed)
    .map((embed) => (embed.metadata?.content_type?.startsWith('image') ? embed.url : null))
    .filter(isTruthy);

  const embeddedFrames = cast.embeds
    .map((embed) =>
      'frame' in embed ? (embed.frame && !embed.metadata?.content_type?.startsWith('image') ? embed.frame : null) : null
    )
    .filter(isTruthy);

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

      {embeddedFrames.length && !nested
        ? embeddedFrames.map((embeddedFrame) => (
            <Stack gap={1} my={1} key={embeddedFrame.url}>
              <Card sx={{ p: 2 }}>
                <CardActionArea href={embeddedFrame.meta.canonical} target='_blank' component={Link} color='inherit'>
                  <Stack gap={2} direction='row' alignItems='center'>
                    {embeddedFrame.links.icon?.[0] ? (
                      <img src={embeddedFrame.links.icon[0].href} style={{ width: '100px', height: '100px' }} />
                    ) : null}
                    <Stack gap={1}>
                      <Typography variant='h6'>{embeddedFrame.meta.title}</Typography>
                      <Typography variant='body2'>{embeddedFrame.meta.description}</Typography>
                      <Typography variant='body2' color='secondary'>
                        {embeddedFrame.meta.canonical}
                      </Typography>
                    </Stack>
                  </Stack>
                </CardActionArea>
              </Card>
            </Stack>
          ))
        : null}
    </Stack>
  );
}
