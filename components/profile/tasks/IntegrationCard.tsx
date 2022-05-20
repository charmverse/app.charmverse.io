import { Paper, SvgIcon, Typography } from '@mui/material';
import { Box } from '@mui/system';
import { useWeb3React } from '@web3-react/core';
import { useUser } from 'hooks/useUser';
import MetamaskIcon from 'public/walletLogos/metamask.svg';
import DiscordIcon from 'public/images/discord-logo-coloured.svg';
import TelegramIcon from 'public/images/telegram_logo.svg';

export default function IntegrationCard () {
  const [currentUser] = useUser();
  const { account, active } = useWeb3React();
  const metamaskConnected = account && active;
  const discordConnected = currentUser?.discordUser;
  const telegramConnected = currentUser?.telegramUser;
  const totalIntegrations = (metamaskConnected ? 1 : 0) + (discordConnected ? 1 : 0) + (telegramConnected ? 1 : 0);

  return (
    <Paper
      elevation={1}
      sx={{
        px: 2,
        display: 'flex',
        gap: 2,
        alignItems: 'center'
      }}
    >
      <Box
        display='flex'
        gap={1}
        alignItems='center'
      >
        <Typography sx={{
          fontSize: '3rem',
          fontWeight: 'bold'
        }}
        >
          {totalIntegrations}
        </Typography>
        <Typography color='secondary'>Integrations</Typography>
      </Box>
      {metamaskConnected && <MetamaskIcon />}
      {discordConnected
          && <DiscordIcon />}
      {telegramConnected && (
        <SvgIcon sx={{ height: 35, width: 35 }}>
          <TelegramIcon />
        </SvgIcon>
      )}
    </Paper>
  );
}
