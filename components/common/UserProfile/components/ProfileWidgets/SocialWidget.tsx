import { Stack } from '@mui/system';
import useSWRImmutable from 'swr/immutable';

import charmClient from 'charmClient';
import { SocialIcons } from 'components/u/components/UserDetails/SocialIcons';
import type { Social } from 'components/u/interfaces';

import { ProfileWidget } from './ProfileWidget';

export function SocialWidget({ userId }: { userId: string }) {
  const { data: userDetails, isLoading: isLoadingUserDetails } = useSWRImmutable(`/userDetails/${userId}`, () => {
    return charmClient.getUserDetails();
  });

  const socialDetails = (userDetails?.social as Social | undefined) ?? {};

  const hideSocials =
    !userDetails?.social ||
    (socialDetails?.discordUsername?.length === 0 &&
      socialDetails?.githubURL?.length === 0 &&
      socialDetails?.twitterURL?.length === 0 &&
      socialDetails?.linkedinURL?.length === 0);

  return (
    <ProfileWidget
      title='Social'
      isLoading={isLoadingUserDetails}
      emptyContent={hideSocials ? 'User does not have any social accounts linked' : null}
    >
      {socialDetails && (
        <Stack spacing={1}>
          <SocialIcons
            social={socialDetails}
            showDiscord={!!socialDetails.discordUsername && socialDetails.discordUsername?.length !== 0}
            showTwitter={!!socialDetails.twitterURL && socialDetails.twitterURL?.length !== 0}
            showLinkedIn={!!socialDetails.linkedinURL && socialDetails.linkedinURL?.length !== 0}
            showGithub={!!socialDetails.githubURL && socialDetails.githubURL?.length !== 0}
            direction='column'
            view='detailed'
          />
        </Stack>
      )}
    </ProfileWidget>
  );
}
