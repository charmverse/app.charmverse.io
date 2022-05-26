import { IconButton, Divider, Paper, Tooltip, Typography, Box, Grid } from '@mui/material';
import { useWeb3React } from '@web3-react/core';
import { useUser } from 'hooks/useUser';
import Avatar from 'components/common/Avatar';
import Link from 'next/Link';
import useENSName from 'hooks/useENSName';
import { getDisplayName } from 'lib/users';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import { useRouter } from 'next/router';
import useMultiWalletSigs from 'hooks/useMultiWalletSigs';
import KeyIcon from '@mui/icons-material/Key';
import styled from '@emotion/styled';
import { useTheme } from '@emotion/react';

const IntegrationCardContainer = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing(3)};
  justify-content: space-between;
  ${({ theme }) => `
    ${theme.breakpoints.down('md')} {
      flex-direction: column;
      gap: ${theme.spacing(1.5)};

      img.logo-image {
        transform: scale(0.85);
      }
    }
  `}
`;

export default function IntegrationCard () {
  const [currentUser] = useUser();
  const { account, active } = useWeb3React();
  const metamaskConnected = account && active;
  const discordConnected = currentUser?.discordUser;
  const telegramConnected = currentUser?.telegramUser;
  const totalIntegrations = (metamaskConnected ? 1 : 0) + (discordConnected ? 1 : 0) + (telegramConnected ? 1 : 0);
  const userEnsName = useENSName(currentUser?.addresses[0]);
  const { data: safes } = useMultiWalletSigs();

  return currentUser && (
    <IntegrationCardContainer>
      <Grid container spacing={3}>
        <Grid item xs>
          <Link href='profile/integrations'>
            <Paper
              elevation={1}
              sx={{
                px: {
                  xs: 1, md: 3
                },
                display: 'flex',
                gap: {
                  xs: 1,
                  sm: 2
                },
                alignItems: 'center',
                cursor: 'pointer',
                justifyContent: 'space-between'
              }}
            >
              <Box
                display='flex'
                alignItems='center'
                gap={{
                  xs: 1,
                  sm: 2
                }}
              >
                <Box
                  display='flex'
                  alignItems='center'
                >
                  <Typography sx={{
                    fontSize: {
                      xs: '1.75rem',
                      sm: '2.5rem'
                    },
                    fontWeight: 'bold',
                    mr: {
                      xs: 0.5,
                      sm: 1
                    }
                  }}
                  >
                    {totalIntegrations}
                  </Typography>
                  <Typography
                    color='secondary'
                    sx={{
                      fontWeight: 500,
                      fontSize: {
                        xs: '0.75rem',
                        sm: '1rem'
                      }
                    }}
                  >Integrations
                  </Typography>
                </Box>
                <Divider sx={{ borderRightWidth: 2 }} orientation='vertical' variant='middle' flexItem />
                <Box
                  display='flex'
                  gap={{
                    xs: 1,
                    sm: 2
                  }}
                  height='100%'
                  alignItems='center'
                >
                  <Tooltip title={metamaskConnected ? 'Metamask connected' : 'Metamask not connected'} arrow placement='top'>
                    <img className='logo-image' width={20} height={20} src={metamaskConnected ? '/walletLogos/metamask.png' : '/walletLogos/metamask-greyscale.png'} />
                  </Tooltip>
                  <Tooltip title={discordConnected ? 'Discord connected' : 'Discord not connected'} arrow placement='top'>
                    <img className='logo-image' width={25} height={20} src={discordConnected ? '/images/discord-logo-colored.png' : '/images/discord-logo-greyscale.png'} />
                  </Tooltip>
                  <Tooltip title={telegramConnected ? 'Telegram connected' : 'Telegram not connected'} arrow placement='top'>
                    <img
                      className='logo-image'
                      width={22.5}
                      height={22.5}
                      src={telegramConnected ? '/images/telegram-logo-colored.png' : '/images/telegram-logo-greyscale.png'}
                    />
                  </Tooltip>
                </Box>
                <Divider sx={{ borderRightWidth: 2 }} orientation='vertical' variant='middle' flexItem />
                <Box display='flex' gap={1} height='100%' alignItems='center'>
                  <KeyIcon
                    color='secondary'
                    sx={{
                      display: {
                        xs: 'none',
                        sm: 'inherit'
                      }
                    }}
                  />
                  <Typography
                    color='secondary'
                    fontWeight={500}
                    sx={{
                      fontSize: {
                        sm: '1rem',
                        xs: '1.75rem'
                      },
                      mr: 0.5
                    }}
                  >
                    {safes?.length}
                  </Typography>
                  <Typography
                    color='secondary'
                    sx={{
                      fontWeight: 500,
                      fontSize: {
                        xs: '0.75rem',
                        sm: 'inherit'
                      }
                    }}
                  >
                    Multisig accounts
                  </Typography>
                </Box>
              </Box>
              <IconButton>
                <ArrowForwardIosIcon color='secondary' fontSize='small' />
              </IconButton>
            </Paper>
          </Link>
        </Grid>
        <Grid item xs sx={{ maxWidth: { md: '300px' } }}>
          <Link href='/profile/public'>
            <Paper
              elevation={1}
              sx={{
                height: '100%',
                p: 1,
                cursor: 'pointer'
              }}
            >

              <Box
                height='100%'
                display='flex'
                justifyContent='space-between'
                alignItems='center'
              >
                <Box
                  display='flex'
                  alignItems='center'
                  gap={1.5}
                  sx={{
                    '.MuiAvatar-root': {
                      height: 40,
                      width: 40,
                      fontSize: '1.25rem'
                    }
                  }}
                >
                  <Avatar size='large' variant='circular' name={userEnsName || getDisplayName(currentUser)} avatar={currentUser.avatar} />
                  <Typography fontWeight={500} color='secondary'>
                    My Public Profile
                  </Typography>
                </Box>
                <IconButton>
                  <ArrowForwardIosIcon color='secondary' fontSize='small' />
                </IconButton>
              </Box>
            </Paper>
          </Link>
        </Grid>
      </Grid>
    </IntegrationCardContainer>
  );
}
