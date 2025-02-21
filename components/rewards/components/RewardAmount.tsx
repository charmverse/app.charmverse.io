import type { Bounty as Reward } from '@charmverse/core/prisma';
import RewardIcon from '@mui/icons-material/RequestPageOutlined';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography, { type TypographyProps } from '@mui/material/Typography';
import { getChainById } from '@packages/connectors/chains';
import { isTruthy } from '@packages/lib/utils/types';
import { fancyTrim } from '@packages/utils/strings';
import millify from 'millify';

import { EmptyPlaceholder } from 'components/common/DatabaseEditor/components/properties/EmptyPlaceholder';
import { TokenLogo } from 'components/common/Icons/TokenLogo';
import { TokenBadge } from 'components/common/TokenBadge';
import { usePaymentMethods } from 'hooks/usePaymentMethods';
import { getTokenInfo } from 'lib/tokens/tokenData';

export interface IRewardBadgeProps {
  reward: Partial<Pick<Reward, 'rewardAmount' | 'rewardToken' | 'chainId' | 'customReward' | 'status'>>;
}

export function RewardAmount({
  reward,
  truncatePrecision = 2,
  typographyProps,
  fullForm,
  noRewardText,
  noAmountText,
  requireTokenAmount,
  showFullCustomRewardText
}: {
  noRewardText?: string;
  noAmountText?: string;
  fullForm?: boolean;
  reward: Partial<Pick<Reward, 'rewardAmount' | 'rewardToken' | 'chainId' | 'customReward' | 'rewardType'>>;
  truncatePrecision?: number;
  typographyProps?: TypographyProps;
  requireTokenAmount?: boolean;
  showFullCustomRewardText?: boolean;
}) {
  const [paymentMethods] = usePaymentMethods();

  if (reward.customReward) {
    return (
      <Tooltip title={reward.customReward}>
        <Stack flexDirection='row' gap={0.5} alignItems='center'>
          <RewardIcon fontSize='small' color='secondary' />
          <Typography {...typographyProps}>
            {showFullCustomRewardText ? reward.customReward : fancyTrim(reward.customReward, 15)}
          </Typography>
        </Stack>
      </Tooltip>
    );
  }

  if (reward.rewardType === 'none' || !isTruthy(reward.rewardToken) || !isTruthy(reward.chainId)) {
    return noRewardText ? <Typography>{noRewardText}</Typography> : null;
  }

  const rewardAmount = reward.rewardAmount; // amount is optional for reward templates
  const rewardToken = reward.rewardToken;
  const chainId = reward.chainId;
  const truncatedAmount = truncateAmount({
    amount: rewardAmount,
    precision: truncatePrecision,
    requireAmount: !!requireTokenAmount
  });

  const tokenInfo = getTokenInfo({
    chainId,
    methods: paymentMethods,
    symbolOrAddress: rewardToken
  });

  const formattedAmount = rewardAmount
    ? Intl.NumberFormat(undefined, { maximumSignificantDigits: 3 }).format(rewardAmount)
    : '';
  const chain = reward.chainId ? getChainById(reward.chainId) : undefined;
  const tooltip = `${formattedAmount} ${tokenInfo.tokenSymbol} ${chain ? `on ${chain.chainName}` : ''}`;

  return (
    <Tooltip arrow placement='top' title={rewardAmount === 0 ? '' : tooltip}>
      <Box display='flex' alignItems='center' gap={1} flexGrow={1}>
        {!rewardAmount && requireTokenAmount ? (
          <EmptyPlaceholder>Enter amount</EmptyPlaceholder>
        ) : fullForm ? (
          <TokenBadge tokenAmount={rewardAmount} chainId={chainId} tokenAddress={rewardToken} />
        ) : (
          <>
            <TokenLogo src={tokenInfo.canonicalLogo} />
            {truncatedAmount && (
              <Typography component='span' variant='body2' data-test='reward-amount' {...typographyProps}>
                {truncatedAmount} {tokenInfo.isContract && tokenInfo.tokenSymbol}
              </Typography>
            )}
            {!truncatedAmount && noAmountText && <EmptyPlaceholder>{noAmountText}</EmptyPlaceholder>}
          </>
        )}
      </Box>
    </Tooltip>
  );
}

function truncateAmount({
  precision,
  amount,
  requireAmount
}: {
  precision: number;
  amount: number | null | undefined;
  requireAmount: boolean;
}) {
  if (!amount && typeof amount !== 'number') return '';
  try {
    const truncatedAmount = millify(amount, { precision });
    if (truncatedAmount === '0') {
      return requireAmount ? '0' : '';
    }
    return truncatedAmount;
  } catch (error) {
    return requireAmount ? 'Invalid number' : '';
  }
}
