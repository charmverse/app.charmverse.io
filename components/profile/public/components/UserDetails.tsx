import { useState } from 'react';
import styled from '@emotion/styled';
import { Box, Divider, Grid, Link as ExternalLink, Stack, SvgIcon, Typography, Tooltip } from '@mui/material';
import Avatar from 'components/settings/workspace/LargeAvatar';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import EditIcon from '@mui/icons-material/Edit';
import TwitterIcon from '@mui/icons-material/Twitter';
import GitHubIcon from '@mui/icons-material/GitHub';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import DiscordIcon from 'public/images/discord_logo.svg';
import Link from 'next/link';
import { useWeb3React } from '@web3-react/core';
import { useUser } from 'hooks/useUser';
import { useUserDetails } from 'hooks';
import { getDisplayName } from 'lib/users';
import useENSName from 'hooks/useENSName';
import charmClient from 'charmClient';
import { DescriptionModal, IdentityModal, SocialModal } from '.';

const StyledBox = styled(Box)`

  svg {
    cursor: pointer;
  }
`;

const StyledDivider = styled(Divider)`
  height: 36px;
`;

export default function UserDetails () {
  const { account } = useWeb3React();
  const [user, setUser] = useUser();
  const [details, setDetails] = useUserDetails({});
  const ENSName = useENSName(account);
  const [copied, setCopied] = useState(false);
  const [name, setName] = useState('CharmVerse');
  const [isDiscordUsernameCopied, setIsDiscordUsernameCopied] = useState(false);
  const [userImage, setUserImage] = useState('');
  const [twitterLink, setTwitterLink] = useState('https://mobile.twitter.com/charmverse');
  const [githubLink, setGithubLink] = useState('https://github.com/charmverse/app.charmverse.io');
  const [discordUsername, setDiscordUsername] = useState('CharmVerse');
  const [linkedinLink, setLinkedinLink] = useState('https://www.linkedin.com/company/charmverse');
  const [isDescriptionModalOpen, setIsDescriptionModalOpen] = useState(false);
  const [isIdentityModalOpen, setIsIdentityModalOpen] = useState(false);
  const [isSocialMediaModalOpen, setIsSocialMediaModalOpen] = useState(false);

  const userName = ENSName || (user ? getDisplayName(user) : '');

  const onDiscordUsernameCopy = () => {
    setIsDiscordUsernameCopied(true);
    setTimeout(() => setIsDiscordUsernameCopied(false), 1000);
  };

  const handleImageUpdate = async (url: string) => {
    const updatedUser = await charmClient.updateUser({
      avatar: url
    });

    setUser(updatedUser);
  };

  return (
    <StyledBox>
      <Stack direction='row' spacing={1} alignItems='center'>
        <Link href='/profile/tasks'>
          <ArrowBackIosNewIcon />
        </Link>
        <Typography component='span' fontSize='1.4em' fontWeight={700}>My Public Profile</Typography>
      </Stack>
      <Stack direction={{ xs: 'column', md: 'row' }} mt={5} spacing={3}>
        <Avatar
          name={userName}
          variant='rounded'
          spaceImage={user?.avatar}
          updateImage={handleImageUpdate}
          displayIcons={true}
        />
        <Grid container direction='column' spacing={0.5}>
          <Grid item>
            <Stack direction='row' spacing={1} alignItems='baseline'>
              <Typography variant='h1'>CharmVerse</Typography>
              <EditIcon
                onClick={() => setIsIdentityModalOpen(true)}
              />
            </Stack>
          </Grid>
          <Grid item mt={1}>
            <Stack direction='row' alignItems='center' spacing={2}>
              { twitterLink && (
              <ExternalLink href={twitterLink} target='_blank' display='flex'>
                <TwitterIcon style={{ color: '#00ACEE', height: '22px' }} />
              </ExternalLink>
              )}
              {
                githubLink && (
                <ExternalLink href={githubLink} target='_blank' display='flex'>
                  <GitHubIcon style={{ color: '#000000', height: '22px' }} />
                </ExternalLink>
                )
              }
              {
                  discordUsername && (
                  <Tooltip
                    placement='top'
                    title={isDiscordUsernameCopied ? 'Copied' : `Click to copy: ${discordUsername}`}
                    disableInteractive
                    arrow
                  >
                    <Box sx={{ display: 'flex' }}>
                      <CopyToClipboard text={discordUsername} onCopy={onDiscordUsernameCopy}>
                        <SvgIcon viewBox='0 -10 70 70' sx={{ color: '#000000', height: '22px' }}>
                          <DiscordIcon />
                        </SvgIcon>
                      </CopyToClipboard>
                    </Box>
                  </Tooltip>
                  )
              }
              {
                linkedinLink && (
                <ExternalLink href={linkedinLink} target='_blank' display='flex'>
                  <LinkedInIcon style={{ color: '#0072B1', height: '22px' }} />
                </ExternalLink>
                )
              }
              <StyledDivider orientation='vertical' flexItem />
              <EditIcon
                onClick={() => setIsSocialMediaModalOpen(true)}
              />
            </Stack>
          </Grid>
          <Grid item container alignItems='center' sx={{ width: 'fit-content' }}>
            <Grid item xs={11}>
              <span>
                {
                    details?.description || 'Tell the world a bit more about yourself ...'
                }
              </span>
            </Grid>
            <Grid item xs={1} pr={1} justifyContent='end'>
              <EditIcon
                onClick={() => setIsDescriptionModalOpen(true)}
              />
            </Grid>
          </Grid>
        </Grid>
      </Stack>
      <IdentityModal
        isOpen={isIdentityModalOpen}
        close={() => setIsIdentityModalOpen(false)}
        defaultValues={{
        }}
      />
      <DescriptionModal
        isOpen={isDescriptionModalOpen}
        close={() => setIsDescriptionModalOpen(false)}
        save={async (description: string) => {
          const updatedDetails = await charmClient.updateUserDetails({ description });
          setDetails(updatedDetails);
          setIsDescriptionModalOpen(false);
        }}
        defaultValues={{
          description: details?.description || ''
        }}
      />
      <SocialModal
        isOpen={isSocialMediaModalOpen}
        close={() => setIsSocialMediaModalOpen(false)}
        defaultValues={{
          twitter: '',
          github: '',
          discord: '',
          linkedin: ''
        }}
      />
    </StyledBox>
  );
}
