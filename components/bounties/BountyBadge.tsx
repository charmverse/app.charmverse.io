
import LaunchIcon from '@mui/icons-material/LaunchOutlined';
import { IconButton, Typography } from '@mui/material';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import { Bounty, BountyStatus } from '@prisma/client';
import { getChainExplorerLink, getChainById } from 'connectors';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import millify from 'millify';
import { BountyWithDetails } from 'models';
import { BOUNTY_LABELS } from 'models/Bounty';
import Image from 'next/image';
import Link from 'next/link';
import { usePaymentMethods } from 'hooks/usePaymentMethods';
import { getTokenInfo } from 'lib/tokens/tokenData';
import ModeStandbyIcon from '@mui/icons-material/ModeStandby';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import GradingIcon from '@mui/icons-material/Grading';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import PaidIcon from '@mui/icons-material/Paid';
import { ReactNode } from 'react';
import styled from '@emotion/styled';
import { BountyStatusColours } from './BountyCard';

const BOUNTY_STATUS_ICONS : Record<BountyStatus, ReactNode> = {
  open: <ModeStandbyIcon />,
  assigned: <AssignmentIndIcon />,
  review: <GradingIcon />,
  complete: <CheckCircleOutlineIcon />,
  paid: <PaidIcon />
};

const BountyStatusBox = styled.div<{ status: BountyStatus }>`
  padding-left: ${({ theme }) => theme.spacing(1)};
  padding-right: ${({ theme }) => theme.spacing(1)};
  border-radius: ${({ theme }) => theme.shape.borderRadius}px;
  background-color: ${({ status, theme }) => {
    // @ts-ignore
    return theme.palette[BountyStatusColours[status]].main;
  }};
  text-align: center;
  font-weight: bold;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const BountyIcon = styled.span`
  opacity: 0.5;
  display: flex;
`;

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

  const [paymentMethods] = usePaymentMethods();

  const tokenInfo = getTokenInfo(paymentMethods, bounty.rewardToken);

  const bountyLink = `/${space?.domain}/bounties/${bounty.id}`;

  const transactionInfo = (bounty as BountyWithDetails).transactions?.[0];

  const chainName = bounty ? getChainById(bounty.chainId)?.chainName : '';

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
              <Box component='span' sx={{ width: '25px', height: '25px' }}>
                {
                  (tokenInfo.isContract ? (
                    <img alt='' width='100%' height='100%' src={tokenInfo.tokenLogo} />
                  ) : (
                    <Image
                      loading='lazy'
                      width='100%'
                      height='100%'
                      src={tokenInfo.tokenLogo}
                    />
                  ))
                }
              </Box>
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
          <BountyStatusBox status={bounty.status}>
            <BountyIcon>
              {BOUNTY_STATUS_ICONS[bounty.status]}
            </BountyIcon>
            <Typography
              component='span'
              sx={{
                textTransform: 'uppercase',
                fontWeight: 600
              }}
              variant='body1'
              pl={1}
            >
              {BOUNTY_LABELS[bounty.status]}
            </Typography>
          </BountyStatusBox>
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
