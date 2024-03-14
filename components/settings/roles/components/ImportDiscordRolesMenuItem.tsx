import { MenuItem, SvgIcon } from '@mui/material';

import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useDiscordConnection } from 'hooks/useDiscordConnection';
import { useIsAdmin } from 'hooks/useIsAdmin';
import DiscordIcon from 'public/images/logos/discord_logo.svg';

export function ImportDiscordRolesMenuItem({ onClose }: { onClose: () => void }) {
  const { space } = useCurrentSpace();
  const { popupServer } = useDiscordConnection();
  const isAdmin = useIsAdmin();

  const returnUrl = encodeURIComponent(window.location.href);

  const onClick = () => {
    popupServer(encodeURIComponent(returnUrl), space?.id || '');
    onClose();
  };

  if (!isAdmin) {
    return null;
  }
  return (
    <MenuItem disableRipple onClick={onClick}>
      <SvgIcon viewBox='0 -10 70 70' sx={{ transform: 'scale(0.85)', mr: 1 }}>
        <DiscordIcon />
      </SvgIcon>
      Discord
    </MenuItem>
  );
}
