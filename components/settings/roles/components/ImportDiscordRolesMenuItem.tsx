import { MenuItem, SvgIcon } from '@mui/material';
import { useRouter } from 'next/router';

import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useIsAdmin } from 'hooks/useIsAdmin';
import DiscordIcon from 'public/images/discord_logo.svg';

export default function ImportDiscordRolesMenuItem() {
  const router = useRouter();
  const space = useCurrentSpace();

  const isAdmin = useIsAdmin();

  if (!isAdmin) {
    return null;
  }
  return (
    <MenuItem
      disableRipple
      onClick={() => {
        router.push(
          `/api/discord/oauth?redirect=${encodeURIComponent(`${window.location.origin}/${space?.domain}`)}&type=server`
        );
      }}
    >
      <SvgIcon viewBox='0 -10 70 70' sx={{ transform: 'scale(0.85)', mr: 1 }}>
        <DiscordIcon />
      </SvgIcon>
      Discord
    </MenuItem>
  );
}
