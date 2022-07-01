import styled from '@emotion/styled';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import LaunchIcon from '@mui/icons-material/LaunchOutlined';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import ModeStandbyIcon from '@mui/icons-material/ModeStandby';
import PaidIcon from '@mui/icons-material/Paid';
import { IconButton, Typography } from '@mui/material';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Tooltip from '@mui/material/Tooltip';
import { Bounty, BountyStatus } from '@prisma/client';
import TokenLogo from 'components/common/TokenLogo';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { usePaymentMethods } from 'hooks/usePaymentMethods';
import { getTokenAndChainInfoFromPayments } from 'lib/tokens/tokenData';
import millify from 'millify';
import { BOUNTY_LABELS } from 'models/Bounty';
import Link from 'next/link';
import { ReactNode } from 'react';
import { BrandColor } from 'theme/colors';

const BOUNTY_STATUS_ICONS : Record<BountyStatus, ReactNode> = {
  suggestion: <LightbulbIcon />,
  open: <ModeStandbyIcon />,
  inProgress: <AssignmentIndIcon />,
  complete: <CheckCircleOutlineIcon />,
  paid: <PaidIcon />
};

export const BountyStatusColors: Record<BountyStatus, BrandColor> = {
  suggestion: 'purple',
  open: 'teal',
  inProgress: 'yellow',
  complete: 'pink',
  paid: 'gray'
};

const StyledBountyStatusChip = styled(Chip)<{ status: BountyStatus }>`
  background-color: ${({ status, theme }) => {
    // @ts-ignore
    return theme.palette[BountyStatusColors[status]].main;
  }};
  .MuiChip-icon {
    display: flex;
    opacity: 0.5;
  }
  .MuiChip-iconSmall svg {
    font-size: 1.2rem;
  }
  .MuiChip-label {
    font-weight: 600;
  }
  .MuiChip-labelMedium {
    font-size: 0.98rem;
  }
`;

export interface IBountyBadgeProps {
  bounty: Bounty
  layout?: 'row' | 'stacked'
  truncate?: boolean
}

export function BountyStatusChip ({
  size,
  status
}: { size?: 'small', status: BountyStatus }) {
  return (
    <StyledBountyStatusChip
      size={size}
      status={status}
      label={BOUNTY_LABELS[status]}
      variant='filled'
      icon={<span>{BOUNTY_STATUS_ICONS[status]}</span>}
    />
  );
}

export default function BountyStatusBadgeWrapper ({ truncate = false, bounty, layout = 'row' } : IBountyBadgeProps) {
  const [space] = useCurrentSpace();

  const bountyLink = `/${space?.domain}/bounties/${bounty.id}`;

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
            <BountyStatusChip status={bounty.status} />
          </Box>
        </Grid>
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
        <BountyStatusChip status={bounty.status} />
      </Box>
    );
  }
}

export function BountyAmount ({ bounty, truncate = false }: { bounty: Pick<Bounty, 'rewardAmount' | 'rewardToken' | 'chainId'>, truncate?: boolean }) {

  const [paymentMethods] = usePaymentMethods();
  const tokenInfo = getTokenAndChainInfoFromPayments({
    chainId: bounty.chainId,
    methods: paymentMethods,
    symbolOrAddress: bounty.rewardToken
  });

  const tooltip = `${tokenInfo.tokenName} (${tokenInfo.tokenSymbol})`;

  return (
    <Tooltip arrow placement='top' title={bounty.rewardAmount === 0 ? '' : tooltip}>
      <Box sx={{ display: 'inline-flex', alignItems: 'center', verticalAlign: 'middle' }}>

        {
            bounty.rewardAmount === 0 ? (
              <Box sx={{ display: 'flex', verticalAlign: 'middle' }}>
                <Typography
                  component='span'
                  sx={{
                    fontWeight: 600
                  }}
                  mr={0.5}
                  variant='caption'

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
                  <TokenLogo src={tokenInfo.canonicalLogo} />
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
    </Tooltip>
  );
}
