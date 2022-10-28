import styled from '@emotion/styled';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import EditIcon from '@mui/icons-material/Edit';
import type { SxProps } from '@mui/material';
import { Box, Divider, Grid, Stack, Tooltip, Typography } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import { useWeb3React } from '@web3-react/core';
import { usePopupState } from 'material-ui-popup-state/hooks';
import type { Dispatch, SetStateAction } from 'react';
import { useMemo, useState } from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import useSWRImmutable from 'swr/immutable';

import charmClient from 'charmClient';
import Link from 'components/common/Link';
import { TimezoneDisplay } from 'components/members/components/TimezoneDisplay';
import { useUpdateProfileAvatar } from 'components/profile/components/UserDetails/hooks/useUpdateProfileAvatar';
import { useUserDetails } from 'components/profile/components/UserDetails/hooks/useUserDetails';
import Avatar from 'components/settings/workspace/LargeAvatar';
import useENSName from 'hooks/useENSName';
import type { DiscordAccount } from 'lib/discord/getDiscordAccount';
import { hasNftAvatar } from 'lib/users/hasNftAvatar';
import { shortenHex } from 'lib/utilities/strings';
import type { IdentityType, LoggedInUser } from 'models';
import { IDENTITY_TYPES } from 'models';
import type { PublicUser } from 'pages/api/public/profile/[userId]';
import type { TelegramAccount } from 'pages/api/telegram/connect';

import type { Social } from '../../interfaces';
import DescriptionModal from '../DescriptionModal';
import type { IntegrationModel } from '../IdentityModal';
import IdentityModal, { getIdentityIcon } from '../IdentityModal';
import SocialModal from '../SocialModal';
import { TimezoneModal } from '../TimezoneModal';
import UserPathModal from '../UserPathModal';

import { SocialIcons } from './SocialIcons';

const StyledDivider = styled(Divider)`
  height: 36px;
`;

export const isPublicUser = (user: PublicUser | LoggedInUser): user is PublicUser => user.hasOwnProperty('profile');

export interface UserDetailsProps {
  readOnly?: boolean;
  user: PublicUser | LoggedInUser;
  updateUser?: Dispatch<SetStateAction<LoggedInUser | null>>;
  sx?: SxProps;
}

function UserDetails ({ readOnly, user, updateUser, sx = {} }: UserDetailsProps) {
  const { account } = useWeb3React();
  const isPublic = isPublicUser(user);
  const { data: userDetails, mutate } = useSWRImmutable(`/userDetails/${user.id}/${isPublic}`, () => {
    return isPublic ? user.profile : charmClient.getUserDetails();
  });

  const ENSName = useENSName(account);
  const [isPersonalLinkCopied, setIsPersonalLinkCopied] = useState(false);

  const descriptionModalState = usePopupState({ variant: 'popover', popupId: 'description-modal' });
  const userPathModalState = usePopupState({ variant: 'popover', popupId: 'path-modal' });
  const identityModalState = usePopupState({ variant: 'popover', popupId: 'identity-modal' });
  const socialModalState = usePopupState({ variant: 'popover', popupId: 'social-modal' });
  const timezoneModalState = usePopupState({ variant: 'popover', popupId: 'timezone-modal' });

  const { updateProfileAvatar, isSaving: isSavingAvatar } = useUpdateProfileAvatar();
  const { handleUserUpdate } = useUserDetails({ readOnly, user, updateUser });

  const onLinkCopy = () => {
    setIsPersonalLinkCopied(true);
    setTimeout(() => setIsPersonalLinkCopied(false), 1000);
  };

  const socialDetails: Social = userDetails?.social as Social ?? {
    twitterURL: '',
    githubURL: '',
    discordUsername: '',
    linkedinURL: ''
  };

  const identityTypes: IntegrationModel[] = useMemo(() => {
    if (isPublicUser(user)) {
      return [];
    }

    const types: IntegrationModel[] = [];
    if (user?.wallets.length !== 0) {
      types.push({
        type: IDENTITY_TYPES[0],
        username: ENSName || user.wallets[0].address,
        isInUse: user.identityType === IDENTITY_TYPES[0],
        icon: getIdentityIcon(IDENTITY_TYPES[0])
      });
    }

    if (user?.discordUser && user.discordUser.account) {
      const discordAccount = user.discordUser.account as Partial<DiscordAccount>;
      types.push({
        type: IDENTITY_TYPES[1],
        username: discordAccount.username || '',
        isInUse: user.identityType === IDENTITY_TYPES[1],
        icon: getIdentityIcon(IDENTITY_TYPES[1])
      });
    }

    if (user?.telegramUser && user.telegramUser.account) {
      const telegramAccount = user.telegramUser.account as Partial<TelegramAccount>;
      types.push({
        type: IDENTITY_TYPES[2],
        username: telegramAccount.username || `${telegramAccount.first_name} ${telegramAccount.last_name}`,
        isInUse: user.identityType === IDENTITY_TYPES[2],
        icon: getIdentityIcon(IDENTITY_TYPES[2])
      });
    }

    if (user) {
      types.push({
        type: IDENTITY_TYPES[3],
        username: user.identityType === IDENTITY_TYPES[3] && user.username ? user.username : '',
        isInUse: user.identityType === IDENTITY_TYPES[3],
        icon: getIdentityIcon(IDENTITY_TYPES[3])
      });
    }

    return types;
  }, [user]);
  const hostname = typeof window !== 'undefined' ? window.location.origin : '';
  const userPath = user.path || user.id;
  const userLink = `${hostname}/u/${userPath}`;

  return (
    <>
      <Stack direction={{ xs: 'column', md: 'row' }} mt={5} spacing={3} sx={sx}>
        <Avatar
          name={user?.username || ''}
          image={user?.avatar}
          updateAvatar={updateProfileAvatar}
          editable={!readOnly}
          variant='circular'
          canSetNft
          isSaving={isSavingAvatar}
          isNft={hasNftAvatar(user)}
        />
        <Grid container direction='column' spacing={0.5}>
          <Grid item>
            <Stack direction='row' spacing={1} alignItems='end'>
              {user && !isPublicUser(user) && getIdentityIcon(user.identityType as IdentityType)}
              <Typography variant='h1'>{user?.username}</Typography>
              {!readOnly && (
                <IconButton onClick={identityModalState.open} data-testid='edit-identity'>
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
            <SocialIcons social={socialDetails}>
              {!readOnly && (
                <>
                  <StyledDivider orientation='vertical' flexItem />
                  <IconButton onClick={socialModalState.open} data-testid='edit-social'>
                    <EditIcon fontSize='small' />
                  </IconButton>
                </>
              )}
            </SocialIcons>
          </Grid>
          <Grid item container alignItems='center' sx={{ width: 'fit-content', flexWrap: 'initial' }}>
            <Grid item xs={11} sx={{ wordBreak: 'break-word' }}>
              <span>
                {
                  userDetails?.description || (readOnly ? '' : 'Tell the world a bit more about yourself ...')
                }
              </span>
            </Grid>
            <Grid item xs={1} px={1} justifyContent='end' sx={{ display: 'flex' }}>
              {!readOnly && (
                <IconButton onClick={descriptionModalState.open} data-testid='edit-description'>
                  <EditIcon fontSize='small' />
                </IconButton>
              )}
            </Grid>
          </Grid>
          <Grid item container alignItems='center' sx={{ width: 'fit-content', flexWrap: 'initial' }}>
            <Grid item xs={11} sx={{ wordBreak: 'break-word', display: 'flex', alignItems: 'center', gap: 1 }}>
              <TimezoneDisplay
                timezone={userDetails?.timezone}
                defaultValue={(readOnly ? 'N/A' : 'Update your timezone')}
              />
            </Grid>
            <Grid item xs={1} px={1} justifyContent='end' sx={{ display: 'flex' }}>
              {!readOnly && (
                <IconButton onClick={timezoneModalState.open} data-testid='edit-timezone'>
                  <EditIcon fontSize='small' />
                </IconButton>
              )}
            </Grid>
          </Grid>
        </Grid>
      </Stack>
      {!isPublicUser(user) && (
        <>
          <IdentityModal
            isOpen={identityModalState.isOpen}
            close={identityModalState.close}
            save={(id: string, identityType: IdentityType) => {
              const username: string = identityType === IDENTITY_TYPES[0] ? (ENSName || shortenHex(id)) : id;
              handleUserUpdate({ username, identityType });
            }}
            identityTypes={identityTypes}
            identityType={(user?.identityType || IDENTITY_TYPES[0]) as IdentityType}
            username={user?.username || ''}
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
          {
            timezoneModalState.isOpen && (
              <TimezoneModal
                isOpen={timezoneModalState.isOpen}
                close={timezoneModalState.close}
                onSave={async (timezone) => {
                  await charmClient.updateUserDetails({
                    timezone
                  });
                  mutate();
                  timezoneModalState.close();
                }}
                initialTimezone={userDetails?.timezone}
              />
            )
          }
        </>
      )}
    </>
  );
}

export default UserDetails;
