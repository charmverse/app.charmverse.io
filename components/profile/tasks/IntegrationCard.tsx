import { Paper, SvgIcon, Tooltip, Typography } from '@mui/material';
import { Box } from '@mui/system';
import { useWeb3React } from '@web3-react/core';
import { useUser } from 'hooks/useUser';
import MetamaskIcon from 'public/walletLogos/metamask.svg';
import DiscordIcon from 'public/images/discord-logo-coloured.svg';
import TelegramIcon from 'public/images/telegram_logo.svg';
import Avatar from 'components/common/Avatar';
import useENSName from 'hooks/useENSName';
import { getDisplayName } from 'lib/users';
import ExpandCircleDownIcon from '@mui/icons-material/ExpandCircleDown';
import { useRouter } from 'next/router';

export default function IntegrationCard () {
  const [currentUser] = useUser();
  const { account, active } = useWeb3React();
  const metamaskConnected = account && active;
  const discordConnected = currentUser?.discordUser;
  const telegramConnected = currentUser?.telegramUser;
  const totalIntegrations = (metamaskConnected ? 1 : 0) + (discordConnected ? 1 : 0) + (telegramConnected ? 1 : 0);
  const userEnsName = useENSName(currentUser?.addresses[0]);
  const router = useRouter();

  return currentUser && (
    <Box display='flex' gap={2} justifyContent='space-between'>
      <Paper
        elevation={1}
        sx={{
          flexGrow: 1,
          px: 3,
          display: 'flex',
          gap: 2,
          alignItems: 'center',
          cursor: 'pointer'
        }}
        onClick={() => {
          router.push('/profile/integrations');
        }}
      >
        <Box
          display='flex'
          gap={1}
          alignItems='center'
        >
          <Typography sx={{
            fontSize: '2.5rem',
            fontWeight: 'bold'
          }}
          >
            {totalIntegrations}
          </Typography>
          <Typography color='secondary'>Integrations</Typography>
        </Box>
        {metamaskConnected && (
        <Tooltip title='Metamask' arrow placement='top'>
          {/** The tooltip isn't shown without this span */}
          <span style={{
            display: 'flex'
          }}
          ><MetamaskIcon />
          </span>
        </Tooltip>
        )}
        {discordConnected
            && (
            <Tooltip title='Discord' arrow placement='top'>
              <span style={{
                display: 'flex'
              }}
              >
                <DiscordIcon />
              </span>
            </Tooltip>
            )}
        {telegramConnected && (
          <SvgIcon sx={{ height: 35, width: 35 }}>
            <TelegramIcon />
          </SvgIcon>
        )}
      </Paper>
      <Paper
        elevation={1}
        sx={{
          p: 1,
          cursor: 'pointer'
        }}
        onClick={() => {
          router.push('/profile/public');
        }}
      >
        <Box width={200} display='flex' justifyContent='space-between' alignItems='center'>
          <Box display='flex' alignItems='center' gap={1}>
            <Avatar size='large' variant='rounded' name={userEnsName || getDisplayName(currentUser)} avatar={currentUser.avatar} />
            <Typography variant='subtitle1' color='secondary' width={75}>My Public Profile</Typography>
          </Box>
          <ExpandCircleDownIcon
            sx={{
              transform: 'rotate(-90deg)'
            }}
            color='secondary'
          />
        </Box>
      </Paper>
    </Box>
  );
}
