import styled from '@emotion/styled';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import LaunchIcon from '@mui/icons-material/LaunchOutlined';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import ModeStandbyIcon from '@mui/icons-material/ModeStandby';
import PaidIcon from '@mui/icons-material/Paid';
import { IconButton, Typography } from '@mui/material';
import Box from '@mui/material/Box';
import type { ChipProps } from '@mui/material/Chip';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Tooltip from '@mui/material/Tooltip';
import type { Bounty, BountyStatus } from '@prisma/client';
import millify from 'millify';
import Link from 'next/link';
import type { ReactNode } from 'react';

import TokenLogo from 'components/common/TokenLogo';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { usePaymentMethods } from 'hooks/usePaymentMethods';
import type { BountyTaskAction } from 'lib/bounties/getBountyTasks';
import { getTokenAndChainInfoFromPayments } from 'lib/tokens/tokenData';
import { nanofy } from 'lib/utilities/numbers';
import type { BrandColor } from 'theme/colors';

export const BOUNTY_STATUS_LABELS: Record<BountyStatus, string> = {
  suggestion: 'Suggestion',
  open: 'Open',
  inProgress: 'In Progress',
  complete: 'Complete',
  paid: 'Paid'
};

export const BOUNTY_STATUS_ICONS : Record<BountyStatus, ReactNode> = {
  suggestion: <LightbulbIcon />,
  open: <ModeStandbyIcon />,
  inProgress: <AssignmentIndIcon />,
  complete: <CheckCircleOutlineIcon />,
  paid: <PaidIcon />
};

const BOUNTY_ACTION_LABELS: Record<BountyTaskAction, string> = {
  application_pending: 'Application pending',
  application_approved: 'Application approved',
  application_rejected: 'Application rejected',
  work_submitted: 'Work submitted',
  work_approved: 'Work approved',
  payment_needed: 'Payment needed',
  payment_complete: 'Payment complete',
  suggested_bounty: 'Suggested bounty'
};

const BOUNTY_ACTION_ICONS: Record<BountyTaskAction, ReactNode> = {
  application_pending: <ModeStandbyIcon />,
  application_approved: <CheckCircleOutlineIcon />,
  application_rejected: <ModeStandbyIcon />,
  work_submitted: <CheckCircleOutlineIcon />,
  work_approved: <CheckCircleOutlineIcon />,
  payment_needed: <PaidIcon />,
  payment_complete: <PaidIcon />,
  suggested_bounty: <LightbulbIcon />
};

export const BOUNTY_STATUS_COLORS: Record<BountyStatus, BrandColor> = {
  suggestion: 'purple',
  open: 'teal',
  inProgress: 'yellow',
  complete: 'pink',
  paid: 'gray'
};

export const BOUNTY_ACTION_COLORS: Record<BountyTaskAction, BrandColor> = {
  application_pending: 'teal',
  application_approved: 'teal',
  application_rejected: 'red',
  work_submitted: 'yellow',
  work_approved: 'yellow',
  payment_needed: 'pink',
  payment_complete: 'gray',
  suggested_bounty: 'purple'
};

const isBountyStatus = (status: BountyStatus | BountyTaskAction): status is BountyStatus => status in BOUNTY_STATUS_LABELS;
const isBountyAction = (status: BountyStatus | BountyTaskAction): status is BountyTaskAction => status in BOUNTY_ACTION_LABELS;

const StyledBountyStatusChip = styled(Chip)<{ status: BountyStatus | BountyTaskAction }>`
  background-color: ${({ status, theme }) => {
    if (isBountyStatus(status)) {
      return theme.palette[BOUNTY_STATUS_COLORS[status]].main;
    }
    else if (isBountyAction(status)) {
      return theme.palette[BOUNTY_ACTION_COLORS[status]].main;
    }
    else {
      return 'initial';
    }
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
  bounty: Bounty;
  layout?: 'row' | 'stacked';
  truncate?: boolean;
  hideStatus?: boolean;
}

export function BountyStatusChip ({
  status,
  size = 'small'
}: { size?: ChipProps['size'], status: BountyStatus }) {
  return (
    <StyledBountyStatusChip
      size={size}
      status={status}
      label={BOUNTY_STATUS_LABELS[status]}
      variant='filled'
      icon={<span>{BOUNTY_STATUS_ICONS[status]}</span>}
    />
  );
}

export function BountyStatusNexusChip ({
  action,
  size = 'small'
}: { size?: ChipProps['size'], action: BountyTaskAction }) {
  return (
    <StyledBountyStatusChip
      size={size}
      status={action}
      label={BOUNTY_ACTION_LABELS[action]}
      variant='filled'
      icon={<span>{BOUNTY_ACTION_ICONS[action]}</span>}
    />
  );
}

export default function BountyStatusBadgeWrapper ({ truncate = false, hideStatus, bounty, layout = 'row' } : IBountyBadgeProps) {
  const space = useCurrentSpace();

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
            gap: 1,
            alignItems: 'center'
          }}
          >
            <BountyAmount bounty={bounty} truncate={truncate} />
            {!hideStatus && <BountyStatusChip status={bounty.status} />}
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

  const formattedAmount = Intl.NumberFormat(undefined, { maximumSignificantDigits: 3 }).format(bounty.rewardAmount);

  const truncatedAmount = bounty.rewardAmount < 1 ? nanofy({ number: bounty.rewardAmount, spaceUnit: false }) : millify(bounty.rewardAmount);

  const tooltip = `${formattedAmount} ${tokenInfo.tokenName} (${tokenInfo.tokenSymbol})`;

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
                  component='span'
                  sx={{
                    width: 25,
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <TokenLogo height={20} src={tokenInfo.canonicalLogo} />
                </Box>
                <Typography
                  component='span'
                  sx={{
                    fontWeight: 600
                  }}
                  variant='h6'
                  fontSize={18}
                >
                  {truncate ? truncatedAmount : bounty.rewardAmount}
                </Typography>
              </>
            )
          }
      </Box>
    </Tooltip>
  );
}
