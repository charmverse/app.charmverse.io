import { useState } from 'react';
import styled from '@emotion/styled';
import { Box, Divider, Grid, Link as ExternalLink, Stack, SvgIcon, Typography, Tooltip } from '@mui/material';
import Avatar from 'components/settings/workspace/LargeAvatar';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import EditIcon from '@mui/icons-material/Edit';
import TwitterIcon from '@mui/icons-material/Twitter';
import GitHubIcon from '@mui/icons-material/GitHub';
import IconButton from '@mui/material/IconButton';
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
import { Social } from '../types';

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
  const { userDetails, setUserDetails } = useUserDetails();
  const ENSName = useENSName(account);
  const [isDiscordUsernameCopied, setIsDiscordUsernameCopied] = useState(false);
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

  let socialDetails: Social = {};

  if (userDetails && userDetails.social) {
    socialDetails = (JSON.parse(userDetails.social as string) as Social);
  }
  else {
    socialDetails = {
      twitterURL: '',
      githubURL: '',
      discordUsername: '',
      linkedinURL: ''
    };
  }

  const hasAnySocialInformation = (model: Social) => model.twitterURL || model.githubURL || model.discordUsername || model.linkedinURL;

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
          spaceImage={user?.avatar}
          updateImage={handleImageUpdate}
          displayIcons={true}
          sx={{
            boderRadius: '50%'
          }}
        />
        <Grid container direction='column' spacing={0.5}>
          <Grid item>
            <Stack direction='row' spacing={1} alignItems='baseline'>
              <Typography variant='h1'>CharmVerse</Typography>
              <IconButton onClick={() => setIsIdentityModalOpen(true)}>
                <EditIcon />
              </IconButton>
            </Stack>
          </Grid>
          <Grid item mt={1}>
            <Stack direction='row' alignItems='center' spacing={2}>
              { socialDetails && socialDetails.twitterURL && (
                <ExternalLink href={socialDetails.twitterURL} target='_blank' display='flex'>
                  <TwitterIcon style={{ color: '#00ACEE', height: '22px' }} />
                </ExternalLink>
              )}
              {
                socialDetails && socialDetails.githubURL && (
                  <ExternalLink href={socialDetails.githubURL} target='_blank' display='flex'>
                    <GitHubIcon style={{ color: '#888', height: '22px' }} />
                  </ExternalLink>
                )
              }
              {
                  socialDetails && socialDetails.discordUsername && (
                  <Tooltip
                    placement='top'
                    title={isDiscordUsernameCopied ? 'Copied' : `Click to copy: ${socialDetails.discordUsername}`}
                    disableInteractive
                    arrow
                  >
                    <Box sx={{ display: 'initial' }}>
                      <CopyToClipboard text={socialDetails.discordUsername} onCopy={onDiscordUsernameCopy}>
                        <SvgIcon viewBox='0 -10 70 70' sx={{ color: '#5865F2', height: '22px' }}>
                          <DiscordIcon />
                        </SvgIcon>
                      </CopyToClipboard>
                    </Box>
                  </Tooltip>
                  )
              }
              {
                socialDetails && socialDetails.linkedinURL && (
                  <ExternalLink href={socialDetails.linkedinURL} target='_blank' display='flex'>
                    <LinkedInIcon style={{ color: '#0072B1', height: '22px' }} />
                  </ExternalLink>
                )
              }
              {
                !hasAnySocialInformation(socialDetails) && <Typography>No social media links</Typography>
              }
              <StyledDivider orientation='vertical' flexItem />
              <IconButton onClick={() => setIsSocialMediaModalOpen(true)}>
                <EditIcon />
              </IconButton>
            </Stack>
          </Grid>
          <Grid item container alignItems='center' sx={{ width: 'fit-content', flexWrap: 'initial' }}>
            <Grid item xs={11}>
              <span>
                {
                    userDetails?.description || 'Tell the world a bit more about yourself ...'
                }
              </span>
            </Grid>
            <Grid item xs={1} px={1} justifyContent='end' sx={{ display: 'flex' }}>
              <IconButton onClick={() => setIsDescriptionModalOpen(true)}>
                <EditIcon />
              </IconButton>
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
          const updatedDetails = await charmClient.updateUserDetails({
            description
          });
          setUserDetails(updatedDetails);
          setIsDescriptionModalOpen(false);
        }}
        currentDescription={userDetails?.description}
      />
      <SocialModal
        isOpen={isSocialMediaModalOpen}
        close={() => setIsSocialMediaModalOpen(false)}
        save={async (social: Social) => {
          const updatedDetails = await charmClient.updateUserDetails({
            social: JSON.stringify(social)
          });
          setUserDetails(updatedDetails);
          setIsSocialMediaModalOpen(false);
        }}
        social={socialDetails}
      />
    </StyledBox>
  );
}
