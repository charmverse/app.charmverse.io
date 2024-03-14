import Box from '@mui/material/Box';
import ListItem from '@mui/material/ListItem';
import SvgIcon from '@mui/material/SvgIcon';

import { ConnectorButton } from 'components/_app/Web3ConnectionManager/components/WalletSelectorModal/components/ConnectorButton';
import { useDiscordConnection } from 'hooks/useDiscordConnection';
import DiscordIcon from 'public/images/logos/discord_logo.svg';

type Props = {
  redirectUrl?: string;
};

export function DiscordLoginHandler({ redirectUrl }: Props) {
  const { popupLogin } = useDiscordConnection();

  return (
    <Box onClick={() => popupLogin(redirectUrl ?? '/', 'login')} data-test='connect-discord-button'>
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
    </Box>
  );
}
