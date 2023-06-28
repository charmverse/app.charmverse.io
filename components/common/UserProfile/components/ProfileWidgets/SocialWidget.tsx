import { Stack } from '@mui/system';
import useSWRImmutable from 'swr/immutable';

import charmClient from 'charmClient';
import { SocialIcons } from 'components/u/components/UserDetails/SocialIcons';
import type { Social } from 'components/u/interfaces';

import { ProfileWidget } from './ProfileWidget';

export function SocialWidget({ userId }: { userId: string }) {
  const { data: userDetails } = useSWRImmutable(`/userDetails/${userId}`, () => {
    return charmClient.getUserDetails();
  });

  const socialDetails = (userDetails?.social as Social | undefined) ?? {};

  return (
    <ProfileWidget title='Social'>
      <Stack spacing={1}>
        <SocialIcons
          social={socialDetails}
          showDiscord={socialDetails.discordUsername?.length !== 0}
          showTwitter={socialDetails.twitterURL?.length !== 0}
          showLinkedIn={socialDetails.linkedinURL?.length !== 0}
          direction='column'
          view='detailed'
        />
      </Stack>
    </ProfileWidget>
  );
}
