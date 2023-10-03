import type { Bounty, BountyStatus } from '@charmverse/core/prisma';
import styled from '@emotion/styled';
import { AddCommentOutlined, PersonOutline } from '@mui/icons-material';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import LaunchIcon from '@mui/icons-material/LaunchOutlined';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import ModeStandbyIcon from '@mui/icons-material/ModeStandby';
import PaidIcon from '@mui/icons-material/Paid';
import BountyIcon from '@mui/icons-material/RequestPageOutlined';
import { IconButton, Typography, Stack } from '@mui/material';
import Box from '@mui/material/Box';
import type { ChipProps } from '@mui/material/Chip';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Tooltip from '@mui/material/Tooltip';
import millify from 'millify';
import Link from 'next/link';
import type { ReactNode } from 'react';

import TokenLogo from 'components/common/TokenLogo';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { usePaymentMethods } from 'hooks/usePaymentMethods';
import type { BountyNotification } from 'lib/notifications/interfaces';
import { getTokenInfo } from 'lib/tokens/tokenData';
import { fancyTrim } from 'lib/utilities/strings';
import { isTruthy } from 'lib/utilities/types';
import type { BrandColor } from 'theme/colors';

export const BOUNTY_STATUS_LABELS: Record<BountyStatus, string> = {
  suggestion: 'Suggestion',
  open: 'Open',
  inProgress: 'In Progress',
  complete: 'Complete',
  paid: 'Paid'
};

export const BOUNTY_STATUS_ICONS: Record<BountyStatus, ReactNode> = {
  suggestion: <LightbulbIcon />,
  open: <ModeStandbyIcon />,
  inProgress: <AssignmentIndIcon />,
  complete: <CheckCircleOutlineIcon />,
  paid: <PaidIcon />
};

const BOUNTY_ACTION_LABELS: Record<BountyNotification['type'], string> = {
  'application.pending': 'Application pending',
  'application.accepted': 'Application accepted',
  'application.rejected': 'Application rejected',
  'application.submitted': 'Work submitted',
  'application.approved': 'Submission approved',
  'application.payment_pending': 'Payment needed',
  'application.payment_completed': 'Payment complete',
  'suggestion.created': 'Suggested bounty',
  'inline_comment.created': 'Inline comment created',
  'inline_comment.mention.created': 'Inline comment mention created',
  'inline_comment.replied': 'Inline comment replied',
  'mention.created': 'Mention created'
};

const BOUNTY_ACTION_ICONS: Record<BountyNotification['type'], ReactNode> = {
  'application.pending': <ModeStandbyIcon />,
  'application.accepted': <CheckCircleOutlineIcon />,
  'application.rejected': <ModeStandbyIcon />,
  'application.submitted': <CheckCircleOutlineIcon />,
  'application.approved': <CheckCircleOutlineIcon />,
  'application.payment_pending': <PaidIcon />,
  'application.payment_completed': <PaidIcon />,
  'suggestion.created': <LightbulbIcon />,
  'inline_comment.created': <AddCommentOutlined />,
  'inline_comment.replied': <AddCommentOutlined />,
  'inline_comment.mention.created': <PersonOutline />,
  'mention.created': <PersonOutline />
};

export const BOUNTY_STATUS_COLORS: Record<BountyStatus, BrandColor> = {
  suggestion: 'purple',
  open: 'teal',
  inProgress: 'yellow',
  complete: 'pink',
  paid: 'gray'
};

export const BOUNTY_ACTION_COLORS: Record<BountyNotification['type'], BrandColor> = {
  'application.pending': 'teal',
  'application.accepted': 'teal',
  'application.rejected': 'red',
  'application.submitted': 'yellow',
  'application.approved': 'yellow',
  'application.payment_pending': 'pink',
  'application.payment_completed': 'gray',
  'suggestion.created': 'purple',
  'inline_comment.created': 'teal',
  'inline_comment.mention.created': 'teal',
  'inline_comment.replied': 'teal',
  'mention.created': 'teal'
};

const isBountyStatus = (status: BountyStatus | BountyNotification['type']): status is BountyStatus =>
  status in BOUNTY_STATUS_LABELS;
const isBountyAction = (status: BountyStatus | BountyNotification['type']): status is BountyNotification['type'] =>
  status in BOUNTY_ACTION_LABELS;

const StyledBountyStatusChip = styled(Chip)<{ status: BountyStatus | BountyNotification['type'] }>`
  background-color: ${({ status, theme }) => {
    if (isBountyStatus(status)) {
      return theme.palette[BOUNTY_STATUS_COLORS[status]].main;
    } else if (isBountyAction(status)) {
      return theme.palette[BOUNTY_ACTION_COLORS[status]].main;
    } else {
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

export function BountyStatusChip({ status, size = 'small' }: { size?: ChipProps['size']; status: BountyStatus }) {
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

export function BountyStatusNexusChip({
  action,
  size = 'small'
}: {
  size?: ChipProps['size'];
  action: BountyNotification['type'];
}) {
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

export function BountyStatusBadge({ truncate = false, hideStatus, bounty, layout = 'row' }: IBountyBadgeProps) {
  const { space } = useCurrentSpace();

  const bountyLink = `/${space?.domain}/bounties/${bounty.id}`;

  if (layout === 'row') {
    return (
      <Grid container direction='column' alignItems='center'>
        <Grid item xs width='100%'>
          <Box
            sx={{
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
  } else {
    return (
      <Box sx={{ textAlign: 'right' }}>
        <Box display='flex' alignItems='center' justifyContent='space-between'>
          <BountyAmount bounty={bounty} truncate={truncate} />
          <IconButton href={bountyLink} component={Link}>
            <LaunchIcon fontSize='small' />
          </IconButton>
        </Box>
        <BountyStatusChip status={bounty.status} />
      </Box>
    );
  }
}

export function BountyAmount({
  bounty,
  truncate = false
}: {
  bounty: Pick<Bounty, 'rewardAmount' | 'rewardToken' | 'chainId' | 'customReward'>;
  truncate?: boolean;
}) {
  const [paymentMethods] = usePaymentMethods();

  if (bounty.customReward) {
    return (
      <Tooltip title={bounty.customReward}>
        <Stack flexDirection='row' gap={0.5} alignItems='center'>
          <BountyIcon fontSize='small' color='secondary' />
          <Typography>{fancyTrim(bounty.customReward, 15)}</Typography>
        </Stack>
      </Tooltip>
    );
  }

  if (!isTruthy(bounty.rewardAmount) || !isTruthy(bounty.rewardToken) || !isTruthy(bounty.chainId)) {
    return null;
  }

  const rewardAmount = bounty.rewardAmount;
  const rewardToken = bounty.rewardToken;
  const chainId = bounty.chainId;

  const tokenInfo = getTokenInfo({
    chainId,
    methods: paymentMethods,
    symbolOrAddress: rewardToken
  });

  const formattedAmount = Intl.NumberFormat(undefined, { maximumSignificantDigits: 3 }).format(rewardAmount);

  const truncatedAmount = () => {
    try {
      return millify(rewardAmount, { precision: 4 });
    } catch (error) {
      return 'Invalid number';
    }
  };

  const tooltip = `${formattedAmount} ${tokenInfo.tokenName} (${tokenInfo.tokenSymbol})`;

  return (
    <Tooltip arrow placement='top' title={rewardAmount === 0 ? '' : tooltip}>
      <Box sx={{ display: 'inline-flex', alignItems: 'center', verticalAlign: 'middle' }}>
        {rewardAmount === 0 ? (
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
              data-test='bounty-amount'
            >
              {truncate ? truncatedAmount() : rewardAmount}
            </Typography>
          </>
        )}
      </Box>
    </Tooltip>
  );
}
