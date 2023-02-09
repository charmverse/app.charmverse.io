import styled from '@emotion/styled';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import EditIcon from '@mui/icons-material/Edit';
import type { SxProps } from '@mui/material';
import { Box, Divider, Grid, Stack, Tooltip, Typography } from '@mui/material';
import type { IconButtonProps } from '@mui/material/IconButton';
import IconButton from '@mui/material/IconButton';
import type { IdentityType } from '@prisma/client';
import { usePopupState } from 'material-ui-popup-state/hooks';
import type { Dispatch, ReactNode, SetStateAction } from 'react';
import { useMemo, useState } from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import useSWRImmutable from 'swr/immutable';

import charmClient from 'charmClient';
import { hoverIconsStyle } from 'components/common/Icons/hoverIconsStyle';
import Link from 'components/common/Link';
import { TimezoneDisplay } from 'components/members/components/TimezoneDisplay';
import { useUpdateProfileAvatar } from 'components/profile/components/UserDetails/hooks/useUpdateProfileAvatar';
import { useUserDetails } from 'components/profile/components/UserDetails/hooks/useUserDetails';
import Avatar from 'components/settings/workspace/LargeAvatar';
import type { DiscordAccount } from 'lib/discord/getDiscordAccount';
import { hasNftAvatar } from 'lib/users/hasNftAvatar';
import randomName from 'lib/utilities/randomName';
import { matchWalletAddress, shortWalletAddress } from 'lib/utilities/strings';
import type { LoggedInUser } from 'models';
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

const StyledStack = styled(Stack)`
  ${hoverIconsStyle()}
`;

function EditIconContainer({
  children,
  readOnly,
  onClick,
  ...props
}: { children: ReactNode; readOnly?: boolean; onClick: IconButtonProps['onClick'] } & IconButtonProps) {
  return (
    <StyledStack direction='row' spacing={1} alignItems='center'>
      {children}
      {!readOnly && (
        <IconButton onClick={onClick} {...props} className='icons'>
          <EditIcon fontSize='small' />
        </IconButton>
      )}
    </StyledStack>
  );
}

function UserDetails({ readOnly, user, updateUser, sx = {} }: UserDetailsProps) {
  const isPublic = isPublicUser(user);
  const { data: userDetails, mutate } = useSWRImmutable(`/userDetails/${user.id}/${isPublic}`, () => {
    return isPublic ? user.profile : charmClient.getUserDetails();
  });

  const [isPersonalLinkCopied, setIsPersonalLinkCopied] = useState(false);

  const descriptionModalState = usePopupState({ variant: 'popover', popupId: 'description-modal' });
  const userPathModalState = usePopupState({ variant: 'popover', popupId: 'path-modal' });
  const identityModalState = usePopupState({ variant: 'popover', popupId: 'identity-modal' });
  const socialModalState = usePopupState({ variant: 'popover', popupId: 'social-modal' });
  const timezoneModalState = usePopupState({ variant: 'popover', popupId: 'timezone-modal' });

  const { updateProfileAvatar, isSaving: isSavingAvatar } = useUpdateProfileAvatar();
  const { handleUserUpdate } = useUserDetails({ updateUser });

  const onLinkCopy = () => {
    setIsPersonalLinkCopied(true);
    setTimeout(() => setIsPersonalLinkCopied(false), 1000);
  };

  const socialDetails: Social = (userDetails?.social as Social) ?? {
    twitterURL: '',
    githubURL: '',
    discordUsername: '',
    linkedinURL: ''
  };

  const hideSocials =
    readOnly &&
    socialDetails.discordUsername?.length === 0 &&
    socialDetails.githubURL?.length === 0 &&
    socialDetails.twitterURL?.length === 0 &&
    socialDetails.linkedinURL?.length === 0;

  const identityTypes: IntegrationModel[] = useMemo(() => {
    if (isPublicUser(user)) {
      return [];
    }

    const types: IntegrationModel[] = [];
    user.wallets.forEach((wallet) => {
      const address = wallet.address;

      types.push({
        type: 'Wallet',
        username: wallet.ensname ?? wallet.address,
        secondaryUserName: address,
        isInUse: user.identityType === 'Wallet' && matchWalletAddress(user.username, wallet),
        icon: getIdentityIcon('Wallet')
      });
    });
    if (user?.discordUser && user.discordUser.account) {
      const discordAccount = user.discordUser.account as Partial<DiscordAccount>;
      types.push({
        type: 'Discord',
        username: discordAccount.username || '',
        secondaryUserName: `${discordAccount.username} #${discordAccount.discriminator}`,
        isInUse: user.identityType === 'Discord',
        icon: getIdentityIcon('Discord')
      });
    }

    if (user?.telegramUser && user.telegramUser.account) {
      const telegramAccount = user.telegramUser.account as Partial<TelegramAccount>;
      types.push({
        type: 'Telegram',
        username: telegramAccount.username || `${telegramAccount.first_name} ${telegramAccount.last_name}`,
        isInUse: user.identityType === 'Telegram',
        icon: getIdentityIcon('Telegram')
      });
    }

    if (user) {
      types.push({
        type: 'RandomName',
        username: user.identityType === 'RandomName' && user.username ? user.username : randomName(),
        isInUse: user.identityType === 'RandomName',
        icon: getIdentityIcon('RandomName')
      });
    }

    user?.googleAccounts?.forEach((acc) => {
      types.push({
        type: 'Google',
        username: acc.name,
        secondaryUserName: acc.email,
        icon: getIdentityIcon('Google'),
        isInUse: user.identityType === 'Google' && user.username === acc.name
      });
    });

    user.unstoppableDomains?.forEach(({ domain }) => {
      types.push({
        type: 'UnstoppableDomain',
        username: domain,
        isInUse: user.identityType === 'UnstoppableDomain' && user.username === domain,
        icon: getIdentityIcon('UnstoppableDomain')
      });
    });

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
            <EditIconContainer data-testid='edit-identity' readOnly={readOnly} onClick={identityModalState.open}>
              {user && !isPublicUser(user) && getIdentityIcon(user.identityType as IdentityType)}
              <Typography variant='h1'>{shortWalletAddress(user.username)}</Typography>
            </EditIconContainer>
          </Grid>
          {!readOnly && (
            <Grid item>
              <EditIconContainer readOnly={readOnly} onClick={userPathModalState.open}>
                <Typography>
                  {hostname}/u/
                  <Link external href={userLink} target='_blank'>
                    {userPath}
                  </Link>
                </Typography>
                <Tooltip placement='top' title={isPersonalLinkCopied ? 'Copied' : 'Click to copy link'} arrow>
                  <Box sx={{ display: 'grid' }}>
                    <CopyToClipboard text={userLink} onCopy={onLinkCopy}>
                      <IconButton>
                        <ContentCopyIcon fontSize='small' />
                      </IconButton>
                    </CopyToClipboard>
                  </Box>
                </Tooltip>
              </EditIconContainer>
            </Grid>
          )}
          {!hideSocials && (
            <Grid item mt={1} height={40}>
              <EditIconContainer onClick={socialModalState.open} readOnly={readOnly} data-testid='edit-social'>
                <SocialIcons
                  showDiscord={readOnly && socialDetails.discordUsername?.length !== 0}
                  showGithub={readOnly && socialDetails.githubURL?.length !== 0}
                  showLinkedIn={readOnly && socialDetails.linkedinURL?.length !== 0}
                  showTwitter={readOnly && socialDetails.twitterURL?.length !== 0}
                  social={socialDetails}
                />
                {!readOnly && <StyledDivider orientation='vertical' flexItem />}
              </EditIconContainer>
            </Grid>
          )}
          <Grid item container alignItems='center' sx={{ width: 'fit-content', flexWrap: 'initial' }}>
            <EditIconContainer readOnly={readOnly} onClick={descriptionModalState.open} data-testid='edit-description'>
              <span>
                {userDetails?.description || (readOnly ? '' : 'Tell the world a bit more about yourself ...')}
              </span>
            </EditIconContainer>
          </Grid>
          <Grid item container alignItems='center' sx={{ width: 'fit-content', flexWrap: 'initial' }}>
            <EditIconContainer readOnly={readOnly} onClick={timezoneModalState.open} data-testid='edit-timezone'>
              <TimezoneDisplay
                timezone={userDetails?.timezone}
                defaultValue={readOnly ? 'N/A' : 'Update your timezone'}
              />
            </EditIconContainer>
          </Grid>
        </Grid>
      </Stack>
      {!isPublicUser(user) && (
        <>
          <IdentityModal
            isOpen={identityModalState.isOpen}
            close={identityModalState.close}
            save={(username: string, identityType: IdentityType) => {
              handleUserUpdate({ username, identityType });
            }}
            identityTypes={identityTypes}
            identityType={(user?.identityType || 'Wallet') as IdentityType}
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
              updateUser((_user) => ({ ..._user, path }));
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
          {timezoneModalState.isOpen && (
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
          )}
        </>
      )}
    </>
  );
}

export default UserDetails;
