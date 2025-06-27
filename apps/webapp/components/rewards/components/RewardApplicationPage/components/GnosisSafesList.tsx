import type { Application, UserGnosisSafe } from '@charmverse/core/prisma-client';
import { MenuItem } from '@mui/material';
import { getChainById } from '@packages/blockchain/connectors/chains';
import type { SystemError } from '@packages/core/errors';
import type { RewardWithUsers } from '@packages/lib/rewards/interfaces';
import { shortenHex } from '@packages/utils/blockchain';
import { isTruthy } from '@packages/utils/types';

import charmClient from 'charmClient';
import { BlockchainLogo } from 'components/common/Icons/BlockchainLogo';
import { useGnosisSafes } from 'hooks/useGnosisSafes';
import type { GnosisProposeTransactionResult } from 'hooks/useMultiGnosisPayment';
import { useMultiGnosisPayment } from 'hooks/useMultiGnosisPayment';
import { useMultiRewardPayment } from 'hooks/useMultiRewardPayment';
import useMultiWalletSigs from 'hooks/useMultiWalletSigs';
import { useSnackbar } from 'hooks/useSnackbar';
import { useWeb3Account } from 'hooks/useWeb3Account';

type ApplicationLite = Pick<Application, 'id' | 'walletAddress' | 'bountyId' | 'createdBy'>;

function SafeMenuItem({
  label,
  safeInfo,
  rewards,
  onClick,
  refreshSubmissions,
  onError,
  onSuccess,
  disabled
}: {
  safeInfo: UserGnosisSafe;
  label: string;
  rewards: (RewardWithUsers & { submissions: ApplicationLite[] })[];
  onClick: () => void;
  refreshSubmissions: () => void;
  onSuccess?: VoidFunction;
  disabled?: boolean;
  onError?: (error: SystemError) => void;
}) {
  const { prepareGnosisSafeRewardPayment } = useMultiRewardPayment();
  const { showMessage } = useSnackbar();

  const { makePayment } = useMultiGnosisPayment({
    chainId: safeInfo.chainId,
    onSuccess: onPaymentSuccess,
    safeAddress: safeInfo.address,
    onError,
    transactionPromises: rewards
      .flatMap((reward) => reward.submissions)
      .map((submission) => {
        const reward = rewards.find((_reward) => _reward.id === submission.bountyId);
        if (!reward) {
          return null;
        }

        return prepareGnosisSafeRewardPayment({
          amount: reward.rewardAmount as number,
          applicationId: submission.id,
          recipientAddress: submission.walletAddress as string,
          recipientUserId: submission.createdBy,
          token: reward.rewardToken as string,
          txChainId: reward.chainId as number,
          rewardId: reward.id
        }).catch(() => null);
      })
      .filter(isTruthy)
  });

  async function onPaymentSuccess(result: GnosisProposeTransactionResult) {
    await Promise.all(
      result.transactions.map((transaction) =>
        charmClient.rewards.recordTransaction({
          applicationId: transaction.applicationId,
          transactionId: result.txHash,
          safeTxHash: result.txHash,
          chainId: safeInfo.chainId.toString()
        })
      )
    );

    showMessage(`Transaction${result.transactions.length > 1 ? 's' : ''} added to your Safe`, 'success');

    refreshSubmissions();

    onSuccess?.();
  }

  return (
    <MenuItem
      dense
      disabled={disabled}
      onClick={async () => {
        onClick();
        try {
          await makePayment();
        } catch (error) {
          const typedError = error as SystemError;
          showMessage(typedError.message, typedError.severity);
          onError?.(typedError);
        }
      }}
    >
      {label}
    </MenuItem>
  );
}

export function GnosisSafesList({
  chainIdToUse,
  rewards,
  onClick,
  refreshSubmissions,
  onSuccess,
  onError,
  disabled
}: {
  disabled?: boolean;
  chainIdToUse?: number;
  rewards: (RewardWithUsers & { submissions: ApplicationLite[] })[];
  onClick: VoidFunction;
  refreshSubmissions: VoidFunction;
  onSuccess?: VoidFunction;
  onError?: (error: SystemError) => void;
}) {
  const { chainId } = useWeb3Account();
  const _chainIdToUse = chainIdToUse ?? chainId ?? 1;
  const chainInfo = getChainById(_chainIdToUse);
  const { data: existingSafesData = [] } = useMultiWalletSigs();
  const safeDataRecord = useGnosisSafes(_chainIdToUse);

  return (
    <>
      <MenuItem disabled={disabled} dense sx={{ pointerEvents: 'none', color: 'secondary.main', gap: 1 }}>
        <span style={{ margin: 'auto' }}>Gnosis wallet</span>
        <BlockchainLogo height={16} src={chainInfo?.iconUrl as string} sx={{ margin: 'auto' }} />
      </MenuItem>
      {existingSafesData
        .filter((s) => !s.isHidden && _chainIdToUse === s.chainId)
        .map((safeInfo) => (
          <SafeMenuItem
            disabled={disabled}
            key={safeInfo.address}
            rewards={rewards}
            label={safeDataRecord[safeInfo.address]?.name || shortenHex(safeInfo.address)}
            onClick={onClick}
            safeInfo={safeInfo}
            refreshSubmissions={refreshSubmissions}
            onError={onError}
            onSuccess={onSuccess}
          />
        ))}
    </>
  );
}
