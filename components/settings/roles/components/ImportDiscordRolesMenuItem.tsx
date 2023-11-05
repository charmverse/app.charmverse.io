import { MenuItem, SvgIcon } from '@mui/material';
import { useRouter } from 'next/router';

import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { getDiscordLoginPath } from 'lib/discord/getDiscordLoginPath';
import DiscordIcon from 'public/images/logos/discord_logo.svg';

export function ImportDiscordRolesMenuItem() {
  const router = useRouter();
  const { space } = useCurrentSpace();

  const isAdmin = useIsAdmin();

  if (!isAdmin) {
    return null;
  }
  return (
    <MenuItem
      disableRipple
      onClick={() => {
        router.push(
          getDiscordLoginPath({
            type: 'server',
            redirectUrl: encodeURIComponent(`${window.location.origin}/${space?.domain}`)
          })
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
