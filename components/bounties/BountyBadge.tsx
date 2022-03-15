import { useTheme } from '@emotion/react';
import LaunchIcon from '@mui/icons-material/LaunchOutlined';
import { IconButton, Typography } from '@mui/material';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import { Bounty } from '@prisma/client';
import { getChainExplorerLink, getChainById } from 'connectors';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import millify from 'millify';
import { BountyWithDetails } from 'models';
import { BOUNTY_LABELS } from 'models/Bounty';
import { CryptoCurrency, CryptoLogoPaths } from 'models/Currency';
import Image from 'next/image';
import Link from 'next/link';
import { usePaymentMethods } from 'hooks/usePaymentMethods';
import { getTokenInfo } from 'lib/tokens/tokenData';
import { BountyStatusColours } from './BountyCard';

/**
 * @hideLink used in the Bounty page so we don't show a link when we are already on the page
 * @direction used for the layout of the bounty info and bounty status
 */

export interface IBountyBadgeProps {
  bounty: Bounty
  hideLink?: boolean,
  direction?: 'row' | 'column'
  truncate?: boolean
}

export function BountyBadge ({ truncate = false, bounty, direction = 'row', hideLink = false } : IBountyBadgeProps) {
  const [space] = useCurrentSpace();
  const theme = useTheme();

  const [paymentMethods] = usePaymentMethods();

  const tokenInfo = getTokenInfo(paymentMethods, bounty.rewardToken);

  const bountyLink = `/${space!.domain}/bounty/${bounty.id}`;

  const transactionInfo = (bounty as BountyWithDetails).transactions?.[0];

  const chainName = getChainById(bounty?.chainId as number)?.chainName ?? '';

  return (
    <Grid container direction='column' alignItems='center'>
      <Grid item xs width='100%'>
        <Box sx={{
          display: 'flex',
          flexDirection: direction,
          width: '100%',
          justifyContent: 'space-between'
        }}
        >
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box
                mr={0.75}
                component='span'
                sx={{
                  width: 25,
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                {
            tokenInfo.tokenLogo && (
              <Image
                loading='lazy'
                width={25}
                height={25}
                src={tokenInfo.tokenLogo}
              />
            )
          }
              </Box>
              <Typography
                component='span'
                sx={{
                  fontWeight: 600
                }}
                mr={0.5}
                variant='h6'
              >
                {truncate ? millify(bounty.rewardAmount) : bounty.rewardAmount}
              </Typography>
              <Box
                component='span'
                mr={2}
                sx={{
                  position: 'relative',
                  top: 2,
                  fontSize: 12,
                  opacity: 0.75
                }}
              >
                {tokenInfo.tokenSymbol}
              </Box>
              {
          hideLink === false && (
            <Link href={bountyLink} passHref={true}>
              <IconButton>
                <LaunchIcon sx={{
                  color: 'text.primary'
                }}
                />
              </IconButton>
            </Link>
          )
        }

            </Box>
            <Box sx={{ textAlign: 'left' }}>
              <Typography
                component='span'
                variant='caption'
                px={1}
              >

                {chainName}
              </Typography>
            </Box>
          </Box>
          <Box p={0.5} borderRadius={1} sx={{ background: theme.palette[BountyStatusColours[bounty.status]].main, textAlign: 'center', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Typography
              component='span'
              sx={{
                textTransform: 'uppercase',
                fontWeight: 600
              }}
              variant='body1'
              px={1}
            >
              {BOUNTY_LABELS[bounty.status]}
            </Typography>
          </Box>
        </Box>
      </Grid>
      {
        (bounty.status === 'paid' && transactionInfo) && (
          <Grid item xs>
            <a style={{ textDecoration: 'none', color: 'text.primary' }} href={getChainExplorerLink(transactionInfo.chainId, transactionInfo.transactionId)} target='_blank' rel='noreferrer'>
              <Box sx={{ color: 'text.primary', pt: 0.5, display: 'block' }}>
                <Typography
                  variant='caption'
                  px={1}
                >
                  View transaction details
                </Typography>
                <LaunchIcon sx={{ fontSize: '12px' }} />
              </Box>
            </a>
          </Grid>
        )
      }
    </Grid>
  );
}
