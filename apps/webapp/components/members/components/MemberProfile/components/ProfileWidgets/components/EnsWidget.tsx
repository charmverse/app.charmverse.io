import { styled } from '@mui/material';
import GitHubIcon from '@mui/icons-material/GitHub';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import RedditIcon from '@mui/icons-material/Reddit';
import { Chip, Divider, Stack, SvgIcon, Typography } from '@mui/material';
import type { EnsProfile } from '@packages/profile/getEnsProfile';
import type { ReactNode } from 'react';
import { FaXTwitter } from 'react-icons/fa6';

import Avatar from 'components/common/Avatar';
import DiscordIcon from 'public/images/logos/discord_logo.svg';

import { ProfileWidget } from './ProfileWidget';

const StyledChipStack = styled(Stack)`
  .MuiChip-root {
    margin-right: ${({ theme }) => theme.spacing(1)};
    margin-bottom: ${({ theme }) => theme.spacing(1)};
    margin-left: 0;
  }
`;

function CustomChip({ label, value, icon }: { label: string; value: string; icon?: ReactNode }) {
  return (
    <Chip
      sx={{
        width: 'fit-content'
      }}
      label={
        <Stack direction='row' spacing={0.5} alignItems='center'>
          {icon && <SvgIcon sx={{ height: 18 }}>{icon}</SvgIcon>}
          <Typography variant='subtitle2'>{label}:</Typography>
          <Typography variant='subtitle1'>{value}</Typography>
        </Stack>
      }
    />
  );
}

export function EnsWidget({ ensProfile }: { ensProfile: EnsProfile }) {
  const email = ensProfile.emails?.[0];
  const discord = ensProfile.discord;
  const twitter = ensProfile.twitter;
  const github = ensProfile.github;
  const reddit = ensProfile.reddit;
  const linkedin = ensProfile.linkedin;

  const showEmails = !!email;
  const showAccounts = !!discord || !!twitter || !!github || !!reddit || !!linkedin;

  return (
    <ProfileWidget
      link={`https://app.ens.domains/${ensProfile.ensname}`}
      title='Ethereum Naming Service'
      avatarSrc='/images/logos/ens_logo.svg'
    >
      {ensProfile && (
        <Stack spacing={2}>
          <Stack spacing={1}>
            <Avatar size='large' name={ensProfile.ensname ?? ''} avatar={ensProfile.avatar} variant='circular' />
            <Typography variant='body1' fontWeight='bold'>
              {ensProfile.ensname}
            </Typography>
            {ensProfile.description && <Typography variant='subtitle1'>{ensProfile.description}</Typography>}
          </Stack>
          {showEmails || showAccounts ? (
            <Divider
              sx={{
                my: 1
              }}
            />
          ) : null}

          {showAccounts && (
            <Stack spacing={1}>
              <Typography variant='subtitle2'>Accounts</Typography>
              <StyledChipStack direction='row' flexWrap='wrap'>
                {discord && <CustomChip label='Discord' value={discord} icon={<DiscordIcon />} />}
                {twitter && <CustomChip label='X' value={twitter} icon={<FaXTwitter style={{ color: '#000' }} />} />}
                {github && (
                  <CustomChip label='Github' value={github} icon={<GitHubIcon style={{ color: '#141414' }} />} />
                )}
                {reddit && (
                  <CustomChip label='Reddit' value={reddit} icon={<RedditIcon style={{ color: '#FF5700' }} />} />
                )}
                {linkedin && (
                  <CustomChip label='Linkedin' value={linkedin} icon={<LinkedInIcon style={{ color: '#0072B1' }} />} />
                )}
              </StyledChipStack>
            </Stack>
          )}

          {showEmails && (
            <Stack spacing={1}>
              <Typography variant='subtitle2'>Other Records</Typography>
              <StyledChipStack direction='row' flexWrap='wrap'>
                <CustomChip label='Email' value={email} />
              </StyledChipStack>
            </Stack>
          )}
        </Stack>
      )}
    </ProfileWidget>
  );
}
