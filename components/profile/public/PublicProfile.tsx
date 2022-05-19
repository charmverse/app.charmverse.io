import { useState } from 'react';
import styled from '@emotion/styled';
import { Box, Divider, Grid, Link, Stack, Typography } from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import Avatar from 'components/settings/workspace/LargeAvatar';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import EditIcon from '@mui/icons-material/Edit';
import TwitterIcon from '@mui/icons-material/Twitter';
import GitHubIcon from '@mui/icons-material/GitHub';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import { Modal, DialogTitle } from 'components/common/Modal';
import { SocialModal } from './components';

const StyledBox = styled(Box)`

  svg {
    cursor: pointer;
  }
`;

const StyledDivider = styled(Divider)`
  height: 36px;
`;

export default function PublicProfile () {
  const [name, setName] = useState('Andrei');
  const [userImage, setUserImage] = useState('');
  const [twitterLink, setTwitterLink] = useState('https://mobile.twitter.com/charmverse');
  const [githubLink, setGithubLink] = useState('https://github.com/charmverse/app.charmverse.io');
  const [discordUsername, setDiscordUsername] = useState('CharmVerse');
  const [linkedinLink, setLinkedinLink] = useState('https://www.linkedin.com/company/charmverse');
  const [isDescriptionModalOpen, setIsDescriptionModalOpen] = useState(false);
  const [isSocialMediaModalOpen, setIsSocialMediaModalOpen] = useState(false);

  const handleImageUpdate = (url: string) => {

  };

  return (
    <StyledBox>
      <Stack direction='row' spacing={1} alignItems='center'>
        <ArrowBackIosNewIcon />
        <Typography component='span' fontSize='1.4em' fontWeight={700}>My Public Profile</Typography>
      </Stack>
      <Stack direction='row' mt={5} spacing={2}>
        <Avatar
          name={name}
          variant='rounded'
          spaceImage={userImage}
          updateImage={handleImageUpdate}
          displayIcons={true}
        />
        <Grid container direction='column'>
          <Grid item>
            <Typography variant='h1'>CharmVerse</Typography>
          </Grid>
          <Grid item mt={1}>
            <Stack direction='row' alignItems='center' spacing={2}>
              { twitterLink && (
              <Link href={twitterLink} target='_blank' display='flex'>
                <TwitterIcon style={{ color: '#00ACEE', height: '22px' }} />
              </Link>
              )}
              {
                githubLink && (
                <Link href={githubLink} target='_blank' display='flex'>
                  <GitHubIcon style={{ color: '#000000', height: '22px' }} />
                </Link>
                )
              }
              {
                linkedinLink && (
                <Link href={linkedinLink} target='_blank' display='flex'>
                  <LinkedInIcon style={{ color: '#0072B1', height: '22px' }} />
                </Link>
                )
              }
              <StyledDivider orientation='vertical' flexItem />
              <AddCircleOutlineIcon
                onClick={() => setIsSocialMediaModalOpen(true)}
              />
            </Stack>
          </Grid>
          <Grid item container alignItems='center'>
            <Grid item xs={10}>
              <span>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque laoreet suscipit nibh, vitae scelerisque dui iaculis nec. Donec consectetur dui quis lorem blandit, sit amet cursus quam commodo. Sed nulla orci, feugiat eu quam a, aliquet egestas nibh. Vivamus eget risus felis. Aenean molestie, est sit amet dignissim finibus, libero lacus blandit dolor.
              </span>
            </Grid>
            <Grid item xs={2}>
              <EditIcon
                onClick={() => setIsDescriptionModalOpen(true)}
              />
            </Grid>
          </Grid>
        </Grid>
      </Stack>
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
      <Modal open={isDescriptionModalOpen} onClose={() => {}}>
        <DialogTitle onClose={() => setIsDescriptionModalOpen(false)}>Manage your Description</DialogTitle>
      </Modal>
    </StyledBox>
  );
}
