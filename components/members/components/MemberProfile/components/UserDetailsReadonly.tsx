import type { SxProps, Theme } from '@mui/material';
import { Grid, Stack, Typography } from '@mui/material';
import useSWRImmutable from 'swr/immutable';

import charmClient from 'charmClient';
import { TimezoneDisplay } from 'components/members/components/TimezoneDisplay';
import Avatar from 'components/settings/space/components/LargeAvatar';
import { useUser } from 'hooks/useUser';
import type { Member, Social } from 'lib/members/interfaces';
import { hasNftAvatar } from 'lib/users/hasNftAvatar';

import { SocialIcons } from '../../SocialIcons';

type UserDetailsMiniProps = {
  user: Member;
  sx?: SxProps<Theme>;
};

export function UserDetailsReadonly({ user, sx = {} }: UserDetailsMiniProps) {
  const { user: currentUser } = useUser();

  const { data: userDetails } = useSWRImmutable(`/userDetails/${user.id}`, () => {
    return (user.profile as any) || (currentUser?.id === user.id && charmClient.getUserDetails());
  });

  const googleProperty = user.properties?.find((p) => p.type === 'google');
  const telegramProperty = user.properties?.find((p) => p.type === 'telegram');
  const discordProperty = user.properties?.find((p) => p.type === 'discord');
  const githubProperty = user.properties?.find((p) => p.type === 'github');
  const twitterProperty = user.properties?.find((p) => p.type === 'twitter');
  const linkedinProperty = user.properties?.find((p) => p.type === 'linked_in');

  const socialDetails = (userDetails?.social as Social | undefined) ?? {};
  const hideSocials =
    (discordProperty?.value as string)?.length === 0 &&
    (telegramProperty?.value as string)?.length === 0 &&
    (googleProperty?.value as string)?.length === 0 &&
    socialDetails?.githubURL?.length === 0 &&
    socialDetails?.twitterURL?.length === 0 &&
    socialDetails?.linkedinURL?.length === 0;

  return (
    <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} sx={sx}>
      <Avatar name={user.username} image={user.avatar} variant='circular' canSetNft isNft={hasNftAvatar(user)} />
      <Grid container direction='column' spacing={0.5}>
        <Grid item>
          <Typography variant='h1'>{user.username}</Typography>
        </Grid>
        {!hideSocials && (
          <Grid item mt={1} height={40}>
            <SocialIcons
              social={{
                ...socialDetails,
                telegramUsername: telegramProperty?.value as string,
                googleName: googleProperty?.value as string
              }}
              showDiscord={!!discordProperty?.enabledViews?.includes('profile')}
              showTwitter={!!twitterProperty?.enabledViews?.includes('profile')}
              showGithub={!!githubProperty?.enabledViews?.includes('profile')}
              showLinkedIn={!!linkedinProperty?.enabledViews?.includes('profile')}
              showGoogle={!!googleProperty?.enabledViews?.includes('profile')}
              showTelegram={!!telegramProperty?.enabledViews?.includes('profile')}
            />
          </Grid>
        )}
        {userDetails && (
          <>
            <Grid item container alignItems='center' width='fit-content'>
              <Typography variant='body1' sx={{ wordBreak: 'break-word' }}>
                {userDetails.description}
              </Typography>
            </Grid>
            {userDetails.timezone && (
              <Grid item container alignItems='center' sx={{ width: 'fit-content', flexWrap: 'initial' }}>
                <TimezoneDisplay timezone={userDetails.timezone} defaultValue='N/A' />
              </Grid>
            )}
          </>
        )}
      </Grid>
    </Stack>
  );
}
