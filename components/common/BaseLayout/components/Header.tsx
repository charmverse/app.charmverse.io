import { useTheme } from '@emotion/react';
import styled from '@emotion/styled';
import { Menu, MenuItem } from '@mui/material';
import { bindTrigger, bindMenu } from 'material-ui-popup-state';
import { usePopupState } from 'material-ui-popup-state/hooks';
import Image from 'next/image';
import { useRouter } from 'next/router';

import { Button } from 'components/common/Button';
import UserDisplay from 'components/common/UserDisplay';
import { useUser } from 'hooks/useUser';

const darkLogoImage = '/images/charmverse_logo_sm_black.png';
const whiteLogoImage = '/images/charmverse_logo_sm_white.png';

const HeaderBox = styled.div`
  margin: ${({ theme }) => theme.spacing(3)};
  display: flex;
  justify-content: space-between;
  ${(props) => props.theme.breakpoints.up('md')} {
    justify-content: space-between;
  }
`;

export function Header() {
  const theme = useTheme();
  const logo = theme.palette.mode === 'dark' ? whiteLogoImage : darkLogoImage;
  return (
    <HeaderBox>
      <Image src={logo} alt='CharmVerse' />
      <UserMenu />
    </HeaderBox>
  );
}

function UserMenu() {
  const { user, logoutUser } = useUser();
  const router = useRouter();
  const menuPopupState = usePopupState({ variant: 'popover', popupId: 'menu-dropdown' });

  const isLoginPage = router.pathname === '/';

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
        <MenuItem sx={{ minWidth: '100px' }} onClick={logout}>
          Log out
        </MenuItem>
      </Menu>
    </div>
  );
}
