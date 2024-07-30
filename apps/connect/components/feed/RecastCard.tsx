import ChatBubbleOutlineOutlinedIcon from '@mui/icons-material/ChatBubbleOutlineOutlined';
import FavoriteBorderOutlinedIcon from '@mui/icons-material/FavoriteBorderOutlined';
import FlipCameraAndroidOutlinedIcon from '@mui/icons-material/FlipCameraAndroidOutlined';
import { Card, CardActionArea, Link, Typography } from '@mui/material';
import { Stack } from '@mui/system';
import { relativeTime } from '@root/lib/utils/dates';
import { prettyPrint } from '@root/lib/utils/strings';

import { Avatar } from 'components/common/Avatar';
import type { Recast } from 'lib/feed/getFarcasterUserRecasts';

export function RecastCard({ recast }: { recast: Recast }) {
  const mentionedProfiles = recast.mentioned_profiles.map((profile) => profile.username);

  const recastTextChunks = mentionedProfiles.reduce<
    {
      text: string;
      type: 'text' | 'mention';
    }[]
  >(
    (chunks, username) => {
      return chunks
        .map((chunk) =>
          chunk.text
            .split(`@${username}`)
            .map((text, index, _chunks) => {
              if (_chunks.length - 1 === index) {
                return [
                  {
                    text,
                    type: 'text' as const
                  }
                ];
              }
              return [
                {
                  text,
                  type: 'text' as const
                },
                {
                  text: username,
                  type: 'mention' as const
                }
              ];
            })
            .flat()
        )
        .flat();
    },
    [
      {
        text: recast.text,
        type: 'text'
      }
    ]
  );

  prettyPrint({ recastTextChunks });

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
          <Typography component='p'>
            {recastTextChunks.map((chunk, index) => {
              if (chunk.type === 'text') {
                return (
                  <Typography component='span' key={`${index.toString()}`} variant='body1'>
                    {chunk.text}
                  </Typography>
                );
              }
              return (
                <Link
                  component='a'
                  key={`${index.toString()}`}
                  href={`https://warpcast.com/${chunk.text}`}
                  target='_blank'
                >
                  <Typography variant='body1' component='span' color='primary'>
                    @{chunk.text}
                  </Typography>
                </Link>
              );
            })}
          </Typography>
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
