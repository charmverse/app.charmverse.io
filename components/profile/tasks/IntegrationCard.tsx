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
import styled from '@emotion/styled';
import { useTheme } from '@emotion/react';
import Image from 'next/image';

const IntegrationCardContainer = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing(3)};
  justify-content: space-between;
  ${({ theme }) => `
    ${theme.breakpoints.down('md')} {
      flex-direction: column;
      gap: ${theme.spacing(1.5)};
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
  const router = useRouter();
  const { data: safes } = useMultiWalletSigs();
  const theme = useTheme();
  const mdScreenMediaQuery = theme.breakpoints.down('md');
  const smScreenMediaQuery = theme.breakpoints.down('sm');

  return currentUser && (
    <IntegrationCardContainer>
      <Paper
        elevation={1}
        sx={{
          flexGrow: 1,
          px: 3,
          display: 'flex',
          gap: 2,
          alignItems: 'center',
          cursor: 'pointer',
          justifyContent: 'space-between',
          [smScreenMediaQuery]: {
            px: 1,
            gap: 1
          }
        }}
        onClick={() => {
          router.push('/profile/integrations');
        }}
      >
        <Box
          display='flex'
          gap={2}
          alignItems='center'
          sx={{
            [smScreenMediaQuery]: {
              gap: 1.5
            }
          }}
        >
          <Box
            display='flex'
            gap={1}
            alignItems='center'
          >
            <Typography sx={{
              fontSize: '2.5rem',
              fontWeight: 'bold',
              [smScreenMediaQuery]: {
                fontSize: '2rem'
              }
            }}
            >
              {totalIntegrations}
            </Typography>
            <Typography
              color='secondary'
              sx={{
                fontWeight: 500,
                [smScreenMediaQuery]: {
                  fontSize: '0.75rem'
                }
              }}
            >Integrations
            </Typography>
          </Box>
          <Divider sx={{ borderRightWidth: 2 }} orientation='vertical' variant='middle' flexItem />
          <Box display='flex' gap={1.5} height='100%' alignItems='center'>
            <Tooltip title={metamaskConnected ? 'Metamask connected' : 'Metamask not connected'} arrow placement='top'>
              {/** Tooltip doesn't show without this span and without display: flex the icons aren't centered */}
              <span style={{
                display: 'flex'
              }}
              >
                <Image className='logo-image' width={20} height={20} src={metamaskConnected ? '/walletLogos/metamask.png' : '/walletLogos/metamask-greyscale.png'} />
              </span>
            </Tooltip>
            <Tooltip title={discordConnected ? 'Discord connected' : 'Discord not connected'} arrow placement='top'>
              <span style={{
                display: 'flex'
              }}
              >
                <Image className='logo-image' width={25} height={20} src={discordConnected ? '/images/discord-logo-colored.png' : '/images/discord-logo-greyscale.png'} />
              </span>
            </Tooltip>
            <Tooltip title={telegramConnected ? 'Telegram connected' : 'Telegram not connected'} arrow placement='top'>
              <span style={{
                display: 'flex'
              }}
              >
                <Image className='logo-image' width={22.5} height={22.5} src={telegramConnected ? '/images/telegram-logo-colored.png' : '/images/telegram-logo-greyscale.png'} />
              </span>
            </Tooltip>
          </Box>
          <Divider sx={{ borderRightWidth: 2 }} orientation='vertical' variant='middle' flexItem />
          <Box display='flex' gap={1} height='100%' alignItems='center'>
            <KeyIcon sx={{
              [smScreenMediaQuery]: {
                display: 'none'
              }
            }}
            />
            <Typography
              sx={{
                display: 'flex',
                alignItems: 'center'
              }}
              variant='subtitle1'
              color='secondary'
            >
              <Typography sx={{
                fontSize: '1rem',
                fontWeight: 'bold',
                mr: 0.5,
                [smScreenMediaQuery]: {
                  fontSize: '2rem',
                  mr: 1
                }
              }}
              >
                {safes?.length}
              </Typography>
              <Typography sx={{
                fontWeight: 500,
                [smScreenMediaQuery]: {
                  top: 2,
                  position: 'relative',
                  fontSize: '0.75rem'
                }
              }}
              >
                Multisig accounts
              </Typography>
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
        <Box
          sx={{
            [mdScreenMediaQuery]: {
              width: '100%'
            }
          }}
          width={200}
          display='flex'
          justifyContent='space-between'
          alignItems='center'
        >
          <Box display='flex' alignItems='center' gap={1.5}>
            <Avatar size='large' variant='rounded' name={userEnsName || getDisplayName(currentUser)} avatar={currentUser.avatar} />
            <Typography
              sx={{
                [mdScreenMediaQuery]: {
                  width: '100%'
                }
              }}
              variant='subtitle1'
              color='secondary'
              width={75}
            >My Public Profile
            </Typography>
          </Box>
          <ExpandCircleDownIcon
            sx={{
              transform: 'rotate(-90deg)'
            }}
            color='secondary'
          />
        </Box>
      </Paper>
    </IntegrationCardContainer>
  );
}
