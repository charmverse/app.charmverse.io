import type { SystemError } from '@charmverse/core/errors';
import { log } from '@charmverse/core/log';
import type { Application, UserGnosisSafe } from '@charmverse/core/prisma';
import { BigNumber } from '@ethersproject/bignumber';
import { Contract } from '@ethersproject/contracts';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import type { ButtonProps } from '@mui/material';
import { Divider, Menu, MenuItem, Tooltip } from '@mui/material';
import ERC20ABI from 'abis/ERC20.json';
import { getChainById } from 'connectors/chains';
import { ethers } from 'ethers';
import type { MouseEvent } from 'react';
import { useState } from 'react';
import { parseEther, parseUnits } from 'viem';

import charmClient from 'charmClient';
import { OpenWalletSelectorButton } from 'components/_app/Web3ConnectionManager/components/WalletSelectorModal/OpenWalletSelectorButton';
import { Button } from 'components/common/Button';
import TokenLogo from 'components/common/TokenLogo';
import { useGnosisSafes } from 'hooks/useGnosisSafes';
import type { GnosisProposeTransactionResult } from 'hooks/useMultiGnosisPayment';
import { getPaymentErrorMessage, useMultiGnosisPayment } from 'hooks/useMultiGnosisPayment';
import { useMultiRewardPayment } from 'hooks/useMultiRewardPayment';
import useMultiWalletSigs from 'hooks/useMultiWalletSigs';
import { usePaymentMethods } from 'hooks/usePaymentMethods';
import { useSnackbar } from 'hooks/useSnackbar';
import { useWeb3Account } from 'hooks/useWeb3Account';
import type { SupportedChainId } from 'lib/blockchain/provider/alchemy/config';
import { switchActiveNetwork } from 'lib/blockchain/switchNetwork';
import type { RewardWithUsers } from 'lib/rewards/interfaces';
import { isValidChainAddress } from 'lib/tokens/validation';
import { shortenHex } from 'lib/utilities/blockchain';
import { isTruthy } from 'lib/utilities/types';

type ApplicationLite = Pick<Application, 'id' | 'walletAddress' | 'bountyId' | 'createdBy'>;

function SafeMenuItem({
  label,
  safeInfo,
  rewards,
  onClick,
  refreshSubmissions
}: {
  safeInfo: UserGnosisSafe;
  label: string;
  rewards: (RewardWithUsers & { submissions: ApplicationLite[] })[];
  onClick: () => void;
  refreshSubmissions: () => void;
}) {
  const { prepareGnosisSafeRewardPayment } = useMultiRewardPayment();
  const { showMessage } = useSnackbar();

  const { makePayment } = useMultiGnosisPayment({
    chainId: safeInfo.chainId,
    onSuccess: onPaymentSuccess,
    safeAddress: safeInfo.address,
    transactions: rewards
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
        });
      })
      .filter(isTruthy)
  });

  async function onPaymentSuccess(results: GnosisProposeTransactionResult[]) {
    for (const result of results) {
      await charmClient.rewards.recordTransaction({
        applicationId: result.transaction.applicationId,
        transactionId: result.txHash,
        safeTxHash: result.txHash,
        chainId: safeInfo.chainId.toString()
      });

      await charmClient.rewards.markSubmissionAsPaid(result.transaction.applicationId);
    }

    showMessage(`Transaction${results.length > 1 ? 's' : ''} added to your Safe`, 'success');

    refreshSubmissions();
  }

  return (
    <MenuItem
      dense
      onClick={async () => {
        onClick();
        try {
          await makePayment();
        } catch (error) {
          const typedError = error as SystemError;
          showMessage(typedError.message, typedError.severity);
        }
      }}
    >
      {label}
    </MenuItem>
  );
}

interface Props {
  tokenSymbolOrAddress: string;
  chainIdToUse: number;
  rewards: (RewardWithUsers & { submissions: ApplicationLite[] })[];
  refreshSubmissions: VoidFunction;
  buttonVariant?: ButtonProps['variant'];
}

export function MultiRewardPaymentButton({
  rewards,
  refreshSubmissions,
  chainIdToUse,
  tokenSymbolOrAddress,
  buttonVariant
}: Props) {
  const { showMessage } = useSnackbar();
  const { data: existingSafesData } = useMultiWalletSigs();
  const { account, chainId, signer } = useWeb3Account();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };
  const [sendingTx, setSendingTx] = useState(false);

  const safeDataRecord = useGnosisSafes(chainIdToUse);

  const [paymentMethods] = usePaymentMethods();

  async function recordTransactions(
    transactionResults: { applicationId: string; transactionId: string; chainId: number }[]
  ) {
    try {
      for (const result of transactionResults) {
        await charmClient.rewards.recordTransaction({
          applicationId: result.applicationId,
          chainId: result.chainId.toString(),
          transactionId: result.transactionId
        });
        await charmClient.rewards.markSubmissionAsPaid(result.applicationId);
      }
      refreshSubmissions();
    } catch (err: any) {
      showMessage(err.message || err, 'error');
    }
  }

  const makePayment = async (submission: ApplicationLite) => {
    const reward = rewards.find((_reward) => _reward.id === submission.bountyId);
    if (!reward) {
      showMessage('Invalid application', 'warning');
      return;
    }

    if (!reward.rewardAmount) {
      showMessage('Invalid reward amount', 'warning');
      return;
    }

    if (!chainIdToUse) {
      showMessage('Please set up a chain for this payment.', 'warning');
      return;
    }

    if (!signer) {
      showMessage('Please make sure you are connected to a supported network and your wallet is unlocked.', 'warning');
      return;
    }

    try {
      if (chainIdToUse !== chainId) {
        await switchActiveNetwork(chainIdToUse);
      }

      const receiver = submission.walletAddress as string;

      let receiverAddress = receiver;

      if (receiver.endsWith('.eth') && ethers.utils.isValidName(receiver)) {
        const resolvedWalletAddress = await charmClient.resolveEnsName(receiver);
        if (resolvedWalletAddress === null) {
          showMessage(`Could not resolve ENS name ${receiver}`, 'warning');
          return;
        }

        receiverAddress = resolvedWalletAddress;
      }

      if (isValidChainAddress(tokenSymbolOrAddress)) {
        const tokenContract = new Contract(tokenSymbolOrAddress, ERC20ABI, signer);

        const paymentMethod = paymentMethods.find(
          (method) => method.contractAddress === tokenSymbolOrAddress || method.id === tokenSymbolOrAddress
        );
        let tokenDecimals = paymentMethod?.tokenDecimals;

        if (typeof tokenDecimals !== 'number') {
          try {
            const tokenInfo = await charmClient.getTokenMetaData({
              chainId: chainIdToUse as SupportedChainId,
              contractAddress: tokenSymbolOrAddress
            });
            tokenDecimals = tokenInfo.decimals;
          } catch (error) {
            showMessage(
              `Token information is missing. Please go to payment methods to configure this payment method using contract address ${tokenSymbolOrAddress} on chain: ${chainIdToUse}`,
              'warning'
            );
            return;
          }
        }

        const parsedTokenAmount = parseUnits(reward.rewardAmount.toString(), tokenDecimals);

        // get allowance
        const allowance = await tokenContract.allowance(account, receiverAddress);

        if (BigNumber.from(allowance).lt(parsedTokenAmount)) {
          // approve if the allowance is small
          await tokenContract.approve(receiverAddress, parsedTokenAmount);
        }

        // transfer token
        const tx = await tokenContract.transfer(receiverAddress, parsedTokenAmount);
        return {
          applicationId: submission.id,
          transactionId: tx.hash,
          chainId: chainIdToUse
        };
      } else {
        const tx = await signer.sendTransaction({
          to: receiverAddress,
          value: parseEther(reward.rewardAmount.toString())
        });

        return {
          applicationId: submission.id,
          transactionId: tx.hash,
          chainId: chainIdToUse
        };
      }
    } catch (error: any) {
      const { message, level } = getPaymentErrorMessage(error);
      log.warn(`Error sending payment on blockchain: ${message}`, {
        amount: reward.rewardAmount.toString(),
        chainId,
        error
      });
      showMessage(message, level);
    }
  };

  const hasSafes = Object.keys(safeDataRecord).length > 0;

  if (!account || !chainId || !signer) {
    return (
      <div>
        <Tooltip title='Your wallet must be unlocked to pay for this reward'>
          <OpenWalletSelectorButton size='small' label='Unlock Wallet' />
        </Tooltip>
      </div>
    );
  }

  const multiSubmissionPayment = async (e: MouseEvent<HTMLElement>) => {
    setSendingTx(true);
    try {
      if (!hasSafes) {
        const transactionResults: { applicationId: string; transactionId: string; chainId: number }[] = [];
        const submissions = rewards.flatMap((reward) => reward.submissions);
        for (const submission of submissions) {
          const transactionResult = await makePayment(submission);
          if (transactionResult) {
            transactionResults.push(transactionResult);
          }
        }

        if (transactionResults.length) {
          await recordTransactions(transactionResults);
        }
      } else {
        handleClick(e);
      }
    } catch (_) {
      //
    } finally {
      setSendingTx(false);
    }
  };

  const chainInfo = getChainById(chainIdToUse as number);

  return (
    <>
      <Button
        loading={sendingTx}
        color='primary'
        variant={buttonVariant}
        endIcon={hasSafes && !sendingTx ? <KeyboardArrowDownIcon /> : null}
        size='small'
        onClick={multiSubmissionPayment}
      >
        Send Payment
      </Button>
      {hasSafes && (
        <Menu id='bounty-payment' anchorEl={anchorEl} open={open} onClose={handleClose}>
          <MenuItem dense sx={{ pointerEvents: 'none', color: 'secondary.main' }}>
            Connected wallet
          </MenuItem>
          <MenuItem dense onClick={multiSubmissionPayment}>
            {shortenHex(account ?? '')}
          </MenuItem>
          <Divider />
          <MenuItem dense sx={{ pointerEvents: 'none', color: 'secondary.main', gap: 1 }}>
            <span style={{ margin: 'auto' }}>Gnosis wallet</span>
            <TokenLogo height={16} src={chainInfo?.iconUrl as string} sx={{ margin: 'auto' }} />
          </MenuItem>
          {existingSafesData
            ?.filter((s) => !s.isHidden && chainIdToUse === s.chainId)
            .map((safeInfo) => (
              <SafeMenuItem
                key={safeInfo.address}
                rewards={rewards.filter((reward) => reward.chainId === chainIdToUse)}
                label={safeDataRecord[safeInfo.address]?.name || shortenHex(safeInfo.address)}
                onClick={handleClose}
                safeInfo={safeInfo}
                refreshSubmissions={refreshSubmissions}
              />
            ))}
        </Menu>
      )}
    </>
  );
}
