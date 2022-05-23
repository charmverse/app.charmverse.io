import { Divider, Paper, Tooltip, Typography } from '@mui/material';
import { Box } from '@mui/system';
import { useWeb3React } from '@web3-react/core';
import { useUser } from 'hooks/useUser';
import Avatar from 'components/common/Avatar';
import useENSName from 'hooks/useENSName';
import { getDisplayName } from 'lib/users';
import ExpandCircleDownIcon from '@mui/icons-material/ExpandCircleDown';
import { useRouter } from 'next/router';
import useMultiWalletSigs from 'hooks/useMultiWalletSigs';
import KeyIcon from '@mui/icons-material/Key';

export default function IntegrationCard () {
  const [currentUser] = useUser();
  const { account, active } = useWeb3React();
  const metamaskConnected = account && active;
  const discordConnected = currentUser?.discordUser;
  const telegramConnected = currentUser?.telegramUser;
  const totalIntegrations = (metamaskConnected ? 1 : 0) + (discordConnected ? 1 : 0) + (telegramConnected ? 1 : 0);
  const userEnsName = useENSName(currentUser?.addresses[0]);
  const router = useRouter();
  const { data: safes } = useMultiWalletSigs();

  return currentUser && (
    <Box display='flex' gap={3} justifyContent='space-between'>
      <Paper
        elevation={1}
        sx={{
          flexGrow: 1,
          px: 3,
          display: 'flex',
          gap: 2,
          alignItems: 'center',
          cursor: 'pointer',
          justifyContent: 'space-between'
        }}
        onClick={() => {
          router.push('/profile/integrations');
        }}
      >
        <Box display='flex' gap={2} alignItems='center'>
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
          <Divider sx={{ borderRightWidth: 2 }} orientation='vertical' variant='middle' flexItem />
          <Box display='flex' gap={1.5} height='100%' alignItems='center'>
            <Tooltip title={metamaskConnected ? 'Metamask connected' : 'Metamask not connected'} arrow placement='top'>
              <img height={20} src={metamaskConnected ? '/walletLogos/metamask.png' : '/walletLogos/metamask-greyscale.png'} />
            </Tooltip>
            <Tooltip title={discordConnected ? 'Discord connected' : 'Discord not connected'} arrow placement='top'>
              <img height={20} src={discordConnected ? '/images/discord-logo-colored.png' : '/images/discord-logo-greyscale.png'} />
            </Tooltip>
            <Tooltip title={telegramConnected ? 'Telegram connected' : 'Telegram not connected'} arrow placement='top'>
              <img height={25} src={telegramConnected ? '/images/telegram-logo-colored.png' : '/images/telegram-logo-greyscale.png'} />
            </Tooltip>
          </Box>
          <Divider sx={{ borderRightWidth: 2 }} orientation='vertical' variant='middle' flexItem />
          <Box display='flex' gap={1} height='100%' alignItems='center'>
            <KeyIcon />
            <Typography variant='subtitle1' color='secondary'>
              {safes?.length} Multisig accounts
            </Typography>
          </Box>
        </Box>
        <ExpandCircleDownIcon
          sx={{
            transform: 'rotate(-90deg)'
          }}
          color='secondary'
        />
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
