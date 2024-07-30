import ChatBubbleOutlineOutlinedIcon from '@mui/icons-material/ChatBubbleOutlineOutlined';
import FavoriteBorderOutlinedIcon from '@mui/icons-material/FavoriteBorderOutlined';
import FlipCameraAndroidOutlinedIcon from '@mui/icons-material/FlipCameraAndroidOutlined';
import { Card, CardActionArea, Link, Typography } from '@mui/material';
import { Stack } from '@mui/system';
import { relativeTime } from '@root/lib/utils/dates';

import { Avatar } from 'components/common/Avatar';
import type { Recast } from 'lib/feed/getFarcasterUserRecasts';

function createRecastChunks({ text, ids }: { text: string; ids: string[] }) {
  return ids.reduce<
    {
      text: string;
      type: 'text' | 'mention' | 'link';
    }[]
  >(
    (chunks, id) => {
      return chunks
        .map((chunk) =>
          chunk.text
            .split(id)
            .map((chunkText, index, _chunks) => {
              if (_chunks.length - 1 === index) {
                return [
                  {
                    text: chunkText,
                    type: 'text' as const
                  }
                ];
              }
              return [
                {
                  text: chunkText,
                  type: 'text' as const
                },
                {
                  text: id,
                  type: id.startsWith('@') ? ('mention' as const) : ('link' as const)
                }
              ];
            })
            .flat()
        )
        .flat();
    },
    [
      {
        text,
        type: 'text' as const
      }
    ]
  );
}

function CastContent({ cast }: { cast: Recast }) {
  const mentionedProfiles = cast.mentioned_profiles.map((profile) => `@${profile.username}`);
  const recastParagraphsChunks = cast.text.split('\n').map((text) =>
    createRecastChunks({
      text,
      ids: [...mentionedProfiles, ...cast.embeds.filter((embed) => 'url' in embed).map((embed) => embed.url)]
    })
  );

  return (
    <Stack gap={1}>
      {recastParagraphsChunks.map((recastParagraphChunks, paragraphIndex) => (
        <Typography key={`${paragraphIndex.toString()}`} component='p'>
          {recastParagraphChunks.map((chunk, index) => {
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

      {cast.embeds.length ? (
        <Stack gap={1} my={1}>
          {cast.embeds.map((embed) =>
            'cast_id' in embed ? (
              <Card key={embed.cast_id.cast.hash} sx={{ p: 2 }}>
                <CastCard cast={embed.cast_id.cast} />
              </Card>
            ) : null
          )}
        </Stack>
      ) : null}
    </Stack>
  );
}

function CastCard({ cast }: { cast: Recast }) {
  return (
    <Stack gap={1}>
      <Stack direction='row' gap={1} alignItems='center'>
        <Avatar avatar={cast.author.pfp_url} name={cast.author.username} size='small' />
        <Typography>{cast.author.display_name}</Typography>
        <Typography variant='subtitle1' color='secondary'>
          @{cast.author.username}
        </Typography>
        <Typography>{relativeTime(cast.timestamp)}</Typography>
      </Stack>
      <CastContent cast={cast} />
    </Stack>
  );
}

export function RecastCard({ recast }: { recast: Recast }) {
  return (
    <Card>
      <CardActionArea sx={{ p: 2 }}>
        <Stack gap={1.5}>
          <Stack direction='row' gap={1} alignItems='center'>
            <FlipCameraAndroidOutlinedIcon fontSize='small' />
            <Typography variant='subtitle1' color='secondary'>
              Recasted by
            </Typography>
            <Stack direction='row' gap={0.5} alignItems='center'>
              <Avatar avatar={recast.parent_author.pfp_url} name={recast.parent_author.display_name} size='xSmall' />
              <Typography variant='subtitle1' color='secondary'>
                @{recast.parent_author.username}
              </Typography>
            </Stack>
          </Stack>
          <CastCard cast={recast} />

          <Stack direction='row' gap={1} alignItems='center'>
            <Stack direction='row' gap={0.5} alignItems='center'>
              <ChatBubbleOutlineOutlinedIcon fontSize='small' />
              {recast.replies.count}
            </Stack>
            <Stack direction='row' gap={0.5} alignItems='center'>
              <FlipCameraAndroidOutlinedIcon fontSize='small' />
              {recast.reactions.recasts_count}
            </Stack>
            <Stack direction='row' gap={0.5} alignItems='center'>
              <FavoriteBorderOutlinedIcon fontSize='small' />
              {recast.reactions.likes_count}
            </Stack>
          </Stack>
          {recast.channel && (
            <Link target='_blank' href={`https://warpcast.com/channel/${recast.channel.id}`}>
              <Typography variant='subtitle1' color='secondary'>
                /{recast.channel.id}
              </Typography>
            </Link>
          )}
        </Stack>
      </CardActionArea>
    </Card>
  );
}
