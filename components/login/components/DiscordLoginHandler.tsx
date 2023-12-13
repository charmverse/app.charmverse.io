import { Box, ListItem } from '@mui/material';
import SvgIcon from '@mui/material/SvgIcon';

import { ConnectorButton } from 'components/_app/Web3ConnectionManager/components/WalletSelectorModal/components/ConnectorButton';
import Link from 'components/common/Link';
import { useCustomDomain } from 'hooks/useCustomDomain';
import { useDiscordConnection } from 'hooks/useDiscordConnection';
import { getDiscordLoginPath } from 'lib/discord/getDiscordLoginPath';
import DiscordIcon from 'public/images/logos/discord_logo.svg';

type Props = {
  redirectUrl?: string;
};

export function DiscordLoginHandler({ redirectUrl }: Props) {
  const { isOnCustomDomain } = useCustomDomain();
  const { popupLogin } = useDiscordConnection();

  return isOnCustomDomain ? (
    <Box onClick={() => popupLogin(redirectUrl ?? '/', 'login')}>
      <DiscordLoginItem />
    </Box>
  ) : (
    <Link
      data-test='connect-discord'
      href={
        typeof window !== 'undefined' ? getDiscordLoginPath({ type: 'login', redirectUrl: redirectUrl ?? '/' }) : ''
      }
    >
      <DiscordLoginItem />
    </Link>
  );
}

function DiscordLoginItem() {
  return (
    <ListItem>
      <ConnectorButton
        name='Connect with Discord'
        disabled={false}
        isActive={false}
        isLoading={false}
        icon={
          <SvgIcon viewBox='0 0 70 70' sx={{ color: '#5865F2' }}>
            <DiscordIcon />
          </SvgIcon>
        }
      />
    </ListItem>
  );
}
