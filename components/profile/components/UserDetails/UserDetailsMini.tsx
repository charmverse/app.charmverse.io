import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import type { SxProps, Theme } from '@mui/material';
import { Box, Grid, Stack, Tooltip, Typography } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import { useState } from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import useSWRImmutable from 'swr/immutable';

import charmClient from 'charmClient';
import Link from 'components/common/Link';
import { TimezoneDisplay } from 'components/members/components/TimezoneDisplay';
import Avatar from 'components/settings/workspace/LargeAvatar';
import { hasNftAvatar } from 'lib/users/hasNftAvatar';
import type { LoggedInUser } from 'models';
import type { PublicUser } from 'pages/api/public/profile/[userId]';

import type { Social } from '../../interfaces';

import { SocialIcons } from './SocialIcons';

interface UserDetailsMiniProps {
  readOnly?: boolean;
  user: PublicUser | LoggedInUser;
  sx?: SxProps<Theme>;
}

function UserDetailsMini({ readOnly, user, sx = {} }: UserDetailsMiniProps) {
  const { data: userDetails } = useSWRImmutable(`/userDetails/${user.id}`, () => {
    return charmClient.getUserDetails();
  });

  const [isPersonalLinkCopied, setIsPersonalLinkCopied] = useState(false);

  const onLinkCopy = () => {
    setIsPersonalLinkCopied(true);
    setTimeout(() => setIsPersonalLinkCopied(false), 1000);
  };

  const socialDetails: Social = (userDetails?.social as Social) ?? {
    twitterURL: '',
    githubURL: '',
    discordUsername: '',
    linkedinURL: ''
  };

  const hideSocials =
    socialDetails.discordUsername?.length === 0 &&
    socialDetails.githubURL?.length === 0 &&
    socialDetails.twitterURL?.length === 0 &&
    socialDetails.linkedinURL?.length === 0;

  const hostname = typeof window !== 'undefined' ? window.location.origin : '';
  const userPath = user.path || user.id;
  const userLink = `${hostname}/u/${userPath}`;

  return (
    <Stack direction={{ xs: 'column', md: 'row' }} mt={5} spacing={3} sx={sx}>
      <Avatar name={user.username} image={user.avatar} variant='circular' canSetNft isNft={hasNftAvatar(user)} />
      <Grid container direction='column' spacing={0.5}>
        <Grid item>
          <Typography variant='h1'>{user.username}</Typography>
        </Grid>
        {!readOnly && (
          <Grid item>
            <Typography>
              {hostname}/u/
              <Link external href={userLink} target='_blank'>
                {userPath}
              </Link>
            </Typography>
            <Tooltip placement='top' title={isPersonalLinkCopied ? 'Copied' : 'Click to copy link'} arrow>
              <Box sx={{ display: 'grid' }}>
                <CopyToClipboard text={userLink} onCopy={onLinkCopy}>
                  <IconButton>
                    <ContentCopyIcon fontSize='small' />
                  </IconButton>
                </CopyToClipboard>
              </Box>
            </Tooltip>
          </Grid>
        )}
        {!hideSocials && (
          <Grid item mt={1} height={40}>
            <SocialIcons
              showDiscord={readOnly && socialDetails.discordUsername?.length !== 0}
              showGithub={readOnly && socialDetails.githubURL?.length !== 0}
              showLinkedIn={readOnly && socialDetails.linkedinURL?.length !== 0}
              showTwitter={readOnly && socialDetails.twitterURL?.length !== 0}
              social={socialDetails}
            />
          </Grid>
        )}
        {userDetails && (
          <>
            <Grid item container alignItems='center' width='fit-content'>
              <Typography variant='body1' sx={{ wordBreak: 'break-word' }}>
                {userDetails.description || (readOnly ? '' : 'Tell the world a bit more about yourself ...')}
              </Typography>
            </Grid>
            {!readOnly ||
              (userDetails.timezone && (
                <Grid item container alignItems='center' sx={{ width: 'fit-content', flexWrap: 'initial' }}>
                  <TimezoneDisplay
                    timezone={userDetails.timezone}
                    defaultValue={readOnly ? 'N/A' : 'Update your timezone'}
                  />
                </Grid>
              ))}
          </>
        )}
      </Grid>
    </Stack>
  );
}

export default UserDetailsMini;
