import LaunchIcon from '@mui/icons-material/LaunchOutlined';
import { IconButton, Typography } from '@mui/material';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import { Bounty, BountyStatus } from '@prisma/client';
import { getChainExplorerLink, getChainById } from 'connectors';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import millify from 'millify';
import Tooltip from '@mui/material/Tooltip';
import { BountyWithDetails } from 'models';
import { BOUNTY_LABELS } from 'models/Bounty';
import Link from 'next/link';
import { usePaymentMethods } from 'hooks/usePaymentMethods';
import { getTokenInfo } from 'lib/tokens/tokenData';
import ModeStandbyIcon from '@mui/icons-material/ModeStandby';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import GradingIcon from '@mui/icons-material/Grading';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import PaidIcon from '@mui/icons-material/Paid';
import { ReactNode } from 'react';
import styled from '@emotion/styled';
import { BrandColor } from 'theme/colors';
import { useTheme } from '@emotion/react';

const BOUNTY_STATUS_ICONS : Record<BountyStatus, ReactNode> = {
  suggestion: <LightbulbIcon />,
  open: <ModeStandbyIcon />,
  assigned: <AssignmentIndIcon />,
  review: <GradingIcon />,
  complete: <CheckCircleOutlineIcon />,
  paid: <PaidIcon />
};

export const BountyStatusColours: Record<BountyStatus, BrandColor> = {
  suggestion: 'purple',
  open: 'teal',
  assigned: 'yellow',
  review: 'orange',
  complete: 'pink',
  paid: 'gray'
};

const BountyStatusBox = styled.div<{ status: BountyStatus }>`
  padding-left: 10px;
  padding-right: 15px;
  border-radius: 15px;
  height: 32px;
  text-align: center;
  font-weight: bold;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  background-color: ${({ status, theme }) => {
    // @ts-ignore
    return theme.palette[BountyStatusColours[status]].main;
  }};
`;

const BountyIcon = styled.span`
  display: flex;
  opacity: 0.5;
`;

export interface IBountyBadgeProps {
  bounty: Bounty
  layout?: 'row' | 'stacked'
  truncate?: boolean
}

export function BountyStatusChip ({ status, onDelete }: {status: BountyStatus, onDelete?: (status: BountyStatus) => void}) {

  const theme = useTheme();

  return (
    <Chip
      label={BOUNTY_LABELS[status]}
      variant='filled'
      onDelete={onDelete}
      size='small'
      sx={{
        fontWeight: 'bold',
        backgroundColor: () => {
          return theme.palette[BountyStatusColours[status]]?.main;
        }
      }}
    />
  );
}

function BountyStatusChipWithIcon ({
  status,
  showStatusLogo = true
}: {status: BountyStatus, showStatusLogo?: boolean}) {
  return (

    <BountyStatusBox status={status}>
      {
        showStatusLogo && (
        <BountyIcon>
          {BOUNTY_STATUS_ICONS[status]}
        </BountyIcon>
        )
      }

      <Typography
        component='span'
        sx={{
          fontWeight: 600
        }}
        variant='body1'
        pl={1}
      >
        {BOUNTY_LABELS[status]}
      </Typography>
    </BountyStatusBox>
  );
}

export default function BountyStatusBadgeWrapper ({ truncate = false, bounty, layout = 'row' } : IBountyBadgeProps) {
  const [space] = useCurrentSpace();

  const bountyLink = `/${space?.domain}/bounties/${bounty.id}`;

  const transactionInfo = (bounty as BountyWithDetails).transactions?.[0];

  if (layout === 'row') {
    return (
      <Grid container direction='column' alignItems='center'>
        <Grid item xs width='100%'>
          <Box sx={{
            display: 'flex',
            flexDirection: 'row',
            flexWrap: 'wrap',
            width: '100%',
            justifyContent: 'space-between',
            gap: 1
          }}
          >
            <BountyAmount bounty={bounty} truncate={truncate} />
            <BountyStatusBox status={bounty.status}>
              <BountyIcon>
                {BOUNTY_STATUS_ICONS[bounty.status]}
              </BountyIcon>
              <Typography
                component='span'
                sx={{
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
  else {
    return (
      <Box sx={{ textAlign: 'right' }}>
        <Box display='flex' alignItems='center' justifyContent='space-between'>
          <BountyAmount bounty={bounty} truncate={truncate} />
          <Link href={bountyLink} passHref={true}>
            <IconButton>
              <LaunchIcon fontSize='small' />
            </IconButton>
          </Link>
        </Box>
        <BountyStatusChipWithIcon status={bounty.status} />
      </Box>
    );
  }
}

function BountyAmount ({ bounty, truncate }: { bounty: Bounty, truncate: boolean }) {

  const chainName = bounty ? getChainById(bounty.chainId)?.chainName || '' : '';
  const [paymentMethods] = usePaymentMethods();
  const tokenInfo = getTokenInfo(paymentMethods, bounty.rewardToken);

  const tooltip = `${chainName} (${tokenInfo.tokenSymbol})`;

  return (
    <Tooltip arrow placement='top' title={bounty.rewardAmount === 0 ? '' : tooltip}>
      <div>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>

          {
            bounty.rewardAmount === 0 ? (
              <Box>
                <Typography
                  component='span'
                  sx={{
                    fontWeight: 600
                  }}
                  mr={0.5}
                  variant='caption'
                  margin='auto'
                >
                  Reward not set
                </Typography>
              </Box>
            ) : (
              <>
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
                      <img
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
              </>
            )
          }

        </Box>
      </div>
    </Tooltip>
  );
}
