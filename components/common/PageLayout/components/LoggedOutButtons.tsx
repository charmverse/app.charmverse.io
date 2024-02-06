import styled from '@emotion/styled';
import { LoginOutlined, FlagOutlined } from '@mui/icons-material';
import { Box, Divider, ListItemIcon, ListItemText, MenuItem } from '@mui/material';
import Image from 'next/image';
import { useRouter } from 'next/router';

import { Button } from 'components/common/Button';
import { ContextMenu } from 'components/common/ContextMenu';
import Link from 'components/common/Link';
import { baseUrl } from 'config/constants';
import darkLogoImage from 'public/images/charmverse_logo_icon.png';

const LogoImage = styled(Image)`
  margin-left: -8px;
  filter: ${({ theme }) => (theme.palette.mode === 'dark' ? 'brightness(0) invert(1)' : 'brightness(0)')};
`;
export function LoggedOutButtons() {
  const logo = darkLogoImage;
  const router = useRouter();
  return (
    <Box display='flex'>
      <ContextMenu
        popupId='user-menu'
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center'
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center'
        }}
      >
        <MenuItem
          component={Link}
          color='inherit'
          href={`${baseUrl || ''}/?returnUrl=${router.asPath}`}
          external // avoid space domain being added
        >
          <ListItemIcon>
            <LoginOutlined />
          </ListItemIcon>
          <ListItemText>Sign up or log in</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem
          component={Link}
          href='https://discord.gg/ACYCzBGC2M'
          target='_blank'
          external // avoid space domain being added
        >
          <ListItemIcon>
            <FlagOutlined color='error' />
          </ListItemIcon>
          <ListItemText primaryTypographyProps={{ color: 'error' }}>Report page</ListItemText>
        </MenuItem>
      </ContextMenu>
      <Button
        endIcon={<LogoImage width={24} height={24} src={logo} alt='' />}
        variant='outlined'
        size='small'
        color='inherit'
        href='https://charmverse.io'
        sx={{ ml: 1 }}
        external // avoid space domain being added
      >
        Built with
      </Button>
    </Box>
  );
}
