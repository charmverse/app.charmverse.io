import { Stack } from '@mui/system';

import { SocialIcons } from 'components/u/components/UserDetails/SocialIcons';
import type { Social } from 'components/u/interfaces';

import { ProfileWidget } from './ProfileWidget';

export function SocialWidget({ socialDetails }: { socialDetails: Social }) {
  return (
    <ProfileWidget title='Social'>
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
    </ProfileWidget>
  );
}
