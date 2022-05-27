import { Dispatch, SetStateAction, useState } from 'react';
import useSWR from 'swr';
import styled from '@emotion/styled';
import { Box, Divider, Grid, Link as ExternalLink, Stack, SvgIcon, Typography, Tooltip } from '@mui/material';
import { usePopupState } from 'material-ui-popup-state/hooks';
import Avatar from 'components/settings/workspace/LargeAvatar';
import EditIcon from '@mui/icons-material/Edit';
import TwitterIcon from '@mui/icons-material/Twitter';
import GitHubIcon from '@mui/icons-material/GitHub';
import IconButton from '@mui/material/IconButton';
import Link from 'components/common/Link';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import charmClient from 'charmClient';
import type { PublicUser } from 'pages/api/public/profile/[userPath]';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DiscordIcon from 'public/images/discord_logo.svg';
import { LoggedInUser } from 'models';
import { useWeb3React } from '@web3-react/core';
import { getDisplayName } from 'lib/users';
import useENSName from 'hooks/useENSName';
import DescriptionModal from './DescriptionModal';
import UserPathModal from './UserPathModal';
import SocialModal from './SocialModal';
import IdentityModal from './IdentityModal';
import { Social } from '../interfaces';

const StyledBox = styled(Box)`

  svg {
    cursor: pointer;
  }
`;

const StyledDivider = styled(Divider)`
  height: 36px;
`;

export interface UserDetailsProps {
  readOnly?: boolean;
  user: PublicUser | LoggedInUser;
  updateUser?: Dispatch<SetStateAction<LoggedInUser | null>>;
}

const isPublicUser = (user: PublicUser | LoggedInUser): user is PublicUser => user.hasOwnProperty('profile');

export default function UserDetails ({ readOnly, user, updateUser }: UserDetailsProps) {
  const { account } = useWeb3React();

  const { data: userDetails, mutate } = useSWR(`/userDetails/${user.id}`, () => {
    return isPublicUser(user) ? user.profile : charmClient.getUserDetails();
  });
  const ENSName = useENSName(account);
  const [isDiscordUsernameCopied, setIsDiscordUsernameCopied] = useState(false);
  const [isPersonalLinkCopied, setIsPersonalLinkCopied] = useState(false);

  const descriptionModalState = usePopupState({ variant: 'popover', popupId: 'description-modal' });
  const userPathModalState = usePopupState({ variant: 'popover', popupId: 'path-modal' });
  const identityModalState = usePopupState({ variant: 'popover', popupId: 'identity-modal' });
  const socialModalState = usePopupState({ variant: 'popover', popupId: 'social-modal' });

  const userName = ENSName || (user ? getDisplayName(user) : '');

  const onDiscordUsernameCopy = () => {
    setIsDiscordUsernameCopied(true);
    setTimeout(() => setIsDiscordUsernameCopied(false), 1000);
  };

  const onLinkCopy = () => {
    setIsPersonalLinkCopied(true);
    setTimeout(() => setIsPersonalLinkCopied(false), 1000);
  };

  const handleImageUpdate = async (url: string) => {
    if (!updateUser) {
      // someone else's profile
      return;
    }
    const updatedUser = await charmClient.updateUser({
      avatar: url
    });

    updateUser(updatedUser);
  };

  let socialDetails: Social = {};

  if (userDetails?.social) {
    socialDetails = userDetails.social as Social;
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

  const hostname = typeof window !== 'undefined' ? window.location.origin : '';
  const userPath = user.path || user.id;
  const userLink = `${hostname}/u/${userPath}`;

  return (
    <StyledBox>
      <Stack direction={{ xs: 'column', md: 'row' }} mt={5} spacing={3}>
        <Avatar
          name={userName}
          spaceImage={user?.avatar}
          updateImage={handleImageUpdate}
          displayIcons={!readOnly}
          variant='circular'
        />
        <Grid container direction='column' spacing={0.5}>
          <Grid item>
            <Stack direction='row' spacing={1} alignItems='baseline'>
              <Typography variant='h1'>{userName}</Typography>
              {!readOnly && (
                <IconButton onClick={identityModalState.open}>
                  <EditIcon fontSize='small' />
                </IconButton>
              )}
            </Stack>
          </Grid>
          {!readOnly && (
            <Grid item>
              <Stack direction='row' spacing={1} alignItems='baseline'>
                <Typography>
                  {hostname}/u/<Link external href={userLink} target='_blank'>{userPath}</Link>
                </Typography>
                <Tooltip
                  placement='top'
                  title={isPersonalLinkCopied ? 'Copied' : 'Click to copy link'}
                  arrow
                >
                  <Box sx={{ display: 'grid' }}>
                    <CopyToClipboard text={userLink} onCopy={onLinkCopy}>
                      <IconButton>
                        <ContentCopyIcon fontSize='small' />
                      </IconButton>
                    </CopyToClipboard>
                  </Box>
                </Tooltip>
                <IconButton onClick={userPathModalState.open}>
                  <EditIcon fontSize='small' />
                </IconButton>
              </Stack>
            </Grid>
          )}
          <Grid item mt={1} height={40}>
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
              {!readOnly && (
                <>
                  <StyledDivider orientation='vertical' flexItem />
                  <IconButton onClick={socialModalState.open}>
                    <EditIcon fontSize='small' />
                  </IconButton>
                </>
              )}
            </Stack>
          </Grid>
          <Grid item container alignItems='center' sx={{ width: 'fit-content', flexWrap: 'initial' }}>
            <Grid item xs={11}>
              <span>
                {
                  userDetails?.description || (readOnly ? '' : 'Tell the world a bit more about yourself ...')
                }
              </span>
            </Grid>
            <Grid item xs={1} px={1} justifyContent='end' sx={{ display: 'flex' }}>
              {!readOnly && (
                <IconButton onClick={descriptionModalState.open}>
                  <EditIcon fontSize='small' />
                </IconButton>
              )}
            </Grid>
          </Grid>
        </Grid>
      </Stack>
      <IdentityModal
        isOpen={identityModalState.isOpen}
        close={identityModalState.close}
        defaultValues={{

        }}
      />
      <DescriptionModal
        isOpen={descriptionModalState.isOpen}
        close={descriptionModalState.close}
        save={async (description: string) => {
          await charmClient.updateUserDetails({
            description
          });
          mutate();
          descriptionModalState.close();
        }}
        currentDescription={userDetails?.description}
      />
      <UserPathModal
        isOpen={userPathModalState.isOpen}
        close={userPathModalState.close}
        save={async (path: string) => {
          await charmClient.updateUser({
            path
          });
          // @ts-ignore - not sure why types are wrong
          updateUser(_user => ({ ..._user, path }));
          userPathModalState.close();
        }}
        currentValue={user.path}
      />
      <SocialModal
        isOpen={socialModalState.isOpen}
        close={socialModalState.close}
        save={async (social: Social) => {
          await charmClient.updateUserDetails({
            social
          });
          mutate();
          socialModalState.close();
        }}
        social={socialDetails}
      />
    </StyledBox>
  );
}
