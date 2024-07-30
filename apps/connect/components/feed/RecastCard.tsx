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

export function RecastCard({ recast }: { recast: Recast }) {
  const mentionedProfiles = recast.mentioned_profiles.map((profile) => `@${profile.username}`);
  const recastParagraphsChunks = recast.text.split('\n').map((text) =>
    createRecastChunks({
      text,
      ids: [...mentionedProfiles, ...recast.embeds.filter((embed) => 'url' in embed).map((embed) => embed.url)]
    })
  );

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
          <Stack direction='row' gap={1} alignItems='center'>
            <Avatar avatar={recast.author.pfp_url} name={recast.author.username} size='small' />
            <Typography>{recast.author.display_name}</Typography>
            <Typography variant='subtitle1' color='secondary'>
              @{recast.author.username}
            </Typography>
            <Typography>{relativeTime(recast.timestamp)}</Typography>
          </Stack>
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
                      <Link
                        key={`${index.toString()}`}
                        href={`https://warpcast.com/${chunk.text.slice(1)}`}
                        target='_blank'
                      >
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
          </Stack>

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
                /{recast.channel.name}
              </Typography>
            </Link>
          )}
        </Stack>
      </CardActionArea>
    </Card>
  );
}
