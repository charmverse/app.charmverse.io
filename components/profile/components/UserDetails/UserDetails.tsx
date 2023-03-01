import styled from '@emotion/styled';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import EditIcon from '@mui/icons-material/Edit';
import type { SxProps, Theme } from '@mui/material';
import { Box, Grid, Stack, Tooltip, Typography } from '@mui/material';
import type { IconButtonProps } from '@mui/material/IconButton';
import IconButton from '@mui/material/IconButton';
import type { IdentityType, UserDetails as UserDetailsType } from '@prisma/client';
import { usePopupState } from 'material-ui-popup-state/hooks';
import type { Dispatch, ReactNode, SetStateAction } from 'react';
import { useMemo, useState } from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import useSWRImmutable from 'swr/immutable';
import useSWRMutation from 'swr/mutation';

import charmClient from 'charmClient';
import { hoverIconsStyle } from 'components/common/Icons/hoverIconsStyle';
import Link from 'components/common/Link';
import { useUpdateProfileAvatar } from 'components/profile/components/UserDetails/hooks/useUpdateProfileAvatar';
import { useUserDetails } from 'components/profile/components/UserDetails/hooks/useUserDetails';
import Avatar from 'components/settings/workspace/LargeAvatar';
import { useMembers } from 'hooks/useMembers';
import { useUser } from 'hooks/useUser';
import type { DiscordAccount } from 'lib/discord/getDiscordAccount';
import { hasNftAvatar } from 'lib/users/hasNftAvatar';
import randomName from 'lib/utilities/randomName';
import { matchWalletAddress, shortWalletAddress } from 'lib/utilities/strings';
import type { LoggedInUser } from 'models';
import type { PublicUser } from 'pages/api/public/profile/[userId]';
import type { TelegramAccount } from 'pages/api/telegram/connect';

import type { Social } from '../../interfaces';
import type { IntegrationModel } from '../IdentityModal';
import IdentityModal, { getIdentityIcon } from '../IdentityModal';
import SocialInputs from '../SocialInputs';
import { TimezoneAutocomplete } from '../TimezoneAutocomplete';
import UserDescription from '../UserDescription';
import UserPathModal from '../UserPathModal';

import { isPublicUser } from './utils';

export interface UserDetailsProps {
  readOnly?: boolean;
  user: PublicUser | LoggedInUser;
  updateUser?: Dispatch<SetStateAction<LoggedInUser | null>>;
  sx?: SxProps<Theme>;
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
  const { user: currentUser } = useUser();
  const { mutateMembers } = useMembers();

  const isPublic = isPublicUser(user, currentUser);
  const {
    data: userDetails,
    mutate,
    isLoading
  } = useSWRImmutable(`/userDetails/${user.id}/${isPublic}`, () =>
    isPublic ? user.profile : charmClient.getUserDetails()
  );

  const { trigger: updateUserDetails } = useSWRMutation(
    '/api/profile/details',
    (_url, { arg }: Readonly<{ arg: Partial<UserDetailsType> }>) => charmClient.updateUserDetails(arg)
  );

  const [isPersonalLinkCopied, setIsPersonalLinkCopied] = useState(false);

  const userPathModalState = usePopupState({ variant: 'popover', popupId: 'path-modal' });
  const identityModalState = usePopupState({ variant: 'popover', popupId: 'identity-modal' });

  const { updateProfileAvatar, isSaving: isSavingAvatar } = useUpdateProfileAvatar();
  const { handleUserUpdate } = useUserDetails({ updateUser });

  const onLinkCopy = () => {
    setIsPersonalLinkCopied(true);
    setTimeout(() => setIsPersonalLinkCopied(false), 1000);
  };

  const saveDescription = async (_description: string) => {
    await updateUserDetails({ description: _description });
    await mutate();
    await mutateMembers();
  };

  const saveTimezone = async (_timezone: string | null = null) => {
    await updateUserDetails({ timezone: _timezone });
    await mutate();
    await mutateMembers();
  };

  const saveSocial = async (social: Social) => {
    await updateUserDetails({ social });
    await mutate();
    await mutateMembers();
  };

  const disabled = readOnly ?? isLoading ?? isPublic;

  const identityTypes: IntegrationModel[] = useMemo(() => {
    if (isPublic) {
      return [];
    }

    const types: IntegrationModel[] = [];
    user.wallets?.forEach((wallet) => {
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
      <Grid container direction='column' spacing={2} mt={1} sx={sx}>
        <Grid item>
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
        </Grid>
        <Grid item width='100%'>
          <EditIconContainer data-testid='edit-identity' readOnly={readOnly} onClick={identityModalState.open}>
            {user && !isPublic && getIdentityIcon(user.identityType as IdentityType)}
            <Typography variant='h1' noWrap>
              {shortWalletAddress(user.username)}
            </Typography>
          </EditIconContainer>
        </Grid>
        {!readOnly && (
          <Grid item width='100%'>
            <EditIconContainer readOnly={readOnly} onClick={userPathModalState.open}>
              <Typography noWrap>
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
        <Grid item>
          <UserDescription currentDescription={userDetails?.description} save={saveDescription} readOnly={disabled} />
        </Grid>
        <Grid item>
          <TimezoneAutocomplete userTimezone={userDetails?.timezone} save={saveTimezone} readOnly={disabled} />
        </Grid>
        <SocialInputs social={userDetails?.social as Social} save={saveSocial} readOnly={disabled} />
      </Grid>
      {!isPublic && (
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
          <UserPathModal
            isOpen={userPathModalState.isOpen}
            close={userPathModalState.close}
            save={(path: string) => {
              handleUserUpdate({ path });
              userPathModalState.close();
            }}
            currentValue={user.path}
          />
        </>
      )}
    </>
  );
}

export default UserDetails;
