import { useTheme, styled, Box, Menu, MenuItem, Typography } from '@mui/material';
import { bindTrigger, bindMenu } from 'material-ui-popup-state';
import { usePopupState } from 'material-ui-popup-state/hooks';
import Image from 'next/image';
import { useRouter } from 'next/router';

import { Button } from 'components/common/Button';
import WorkspaceAvatar from 'components/common/PageLayout/components/Sidebar/components/WorkspaceAvatar';
import UserDisplay from 'components/common/UserDisplay';
import IdentityModal from 'components/settings/profile/components/IdentityModal';
import { useBaseCurrentDomain } from 'hooks/useBaseCurrentDomain';
import { useUser } from 'hooks/useUser';
import darkLogoImage from 'public/images/charmverse_logo_sm_black.png';
import whiteLogoImage from 'public/images/charmverse_logo_sm_white.png';

const HeaderBox = styled('div')`
  margin: ${({ theme }) => theme.spacing(3)};
  display: flex;
  justify-content: space-between;
  min-height: 46px;
  ${(props) => props.theme.breakpoints.up('md')} {
    justify-content: space-between;
  }
`;

export function Header() {
  const theme = useTheme();
  const logo = theme.palette.mode === 'dark' ? whiteLogoImage : darkLogoImage;
  const { customDomain, spaceFromPath } = useBaseCurrentDomain();

  return (
    <HeaderBox>
      {spaceFromPath ? (
        <Box display='flex' alignItems='center'>
          <WorkspaceAvatar name={spaceFromPath.name || ''} image={spaceFromPath.spaceImage || null} />
          <Typography variant='body1' noWrap ml={1}>
            {spaceFromPath?.name}
          </Typography>
        </Box>
      ) : customDomain === null ? (
        <Image src={logo} alt='CharmVerse' />
      ) : null}
      <UserMenu />
    </HeaderBox>
  );
}

function UserMenu() {
  const { user, logoutUser } = useUser();
  const router = useRouter();
  const menuPopupState = usePopupState({ variant: 'popover', popupId: 'menu-dropdown' });
  const isLoginPage = router.pathname === '/';
  const identityPopupState = usePopupState({ variant: 'popover', popupId: 'identity-popup' });

  async function logout() {
    await logoutUser();
    // for some reason the token gate doesn't update when the user logs out
    router.push('/');
  }
  // hide login button on login page
  if (isLoginPage) {
    return null;
  }
  return (
    <div>
      <div>
        {user && (
          <Button variant='outlined' color='secondary' {...bindTrigger(menuPopupState)}>
            {' '}
            <UserDisplay avatarSize='small' user={user} sx={{ cursor: 'pointer' }} />
          </Button>
        )}
      </div>
      <Menu onClick={menuPopupState.close} {...bindMenu(menuPopupState)}>
        <MenuItem sx={{ minWidth: '100px' }} {...bindTrigger(identityPopupState)}>
          Manage Identities
        </MenuItem>
        <MenuItem sx={{ minWidth: '100px' }} onClick={logout}>
          Log out
        </MenuItem>
      </Menu>
      {user && <IdentityModal isOpen={identityPopupState.isOpen} close={identityPopupState.close} />}
    </div>
  );
}
