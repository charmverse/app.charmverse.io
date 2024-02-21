import type { SystemError } from '@charmverse/core/errors';
import { log } from '@charmverse/core/log';
import type { Application, UserGnosisSafe } from '@charmverse/core/prisma';
import { BigNumber } from '@ethersproject/bignumber';
import { Contract } from '@ethersproject/contracts';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { Divider, Menu, MenuItem, Tooltip } from '@mui/material';
import type { AlertColor } from '@mui/material/Alert';
import ERC20ABI from 'abis/ERC20.json';
import { getChainById } from 'connectors/chains';
import { ethers } from 'ethers';
import type { MouseEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import { getAddress, parseEther, parseUnits } from 'viem';

import charmClient from 'charmClient';
import { OpenWalletSelectorButton } from 'components/_app/Web3ConnectionManager/components/WalletSelectorModal/OpenWalletSelectorButton';
import { Button } from 'components/common/Button';
import TokenLogo from 'components/common/TokenLogo';
import type { GnosisProposeTransactionResult } from 'hooks/useGnosisPayment';
import { getPaymentErrorMessage, useGnosisPayment } from 'hooks/useGnosisPayment';
import { useMultiRewardPayment } from 'hooks/useMultiRewardPayment';
import useMultiWalletSigs from 'hooks/useMultiWalletSigs';
import { usePaymentMethods } from 'hooks/usePaymentMethods';
import { useSnackbar } from 'hooks/useSnackbar';
import { useUser } from 'hooks/useUser';
import { useWeb3Account } from 'hooks/useWeb3Account';
import type { SupportedChainId } from 'lib/blockchain/provider/alchemy/config';
import { switchActiveNetwork } from 'lib/blockchain/switchNetwork';
import { getSafeApiClient } from 'lib/gnosis/safe/getSafeApiClient';
import type { RewardWithUsers } from 'lib/rewards/interfaces';
import { isValidChainAddress } from 'lib/tokens/validation';
import { shortenHex } from 'lib/utilities/blockchain';
import { lowerCaseEqual } from 'lib/utilities/strings';
import { isTruthy } from 'lib/utilities/types';

function SafeMenuItem({
  label,
  safeInfo,
  rewards,
  submissions,
  onClick,
  onError = () => {},
  refreshSubmission
}: {
  safeInfo: UserGnosisSafe;
  label: string;
  rewards: RewardWithUsers[];
  submissions: Application[];
  onClick: () => void;
  onError: (err: string, severity?: AlertColor) => void;
  refreshSubmission: () => void;
}) {
  const { prepareGnosisSafeRewardPayment } = useMultiRewardPayment({
    rewards
  });
  const { showMessage } = useSnackbar();

  const { makePayment } = useGnosisPayment({
    chainId: safeInfo.chainId,
    onSuccess: onPaymentSuccess,
    safeAddress: safeInfo.address,
    transactions: submissions
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
    }
    showMessage(`Transaction${results.length > 1 ? 's' : ''} added to your Safe`, 'success');

    refreshSubmission();
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
          onError(typedError.message, typedError.severity);
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
  submissions: Application[];
  onSuccess?: (txId: string, chainId: number) => void;
  onError?: (err: string, severity?: AlertColor) => void;
  rewards: RewardWithUsers[];
  refreshSubmission: () => void;
}

export function RewardPaymentButton({
  rewards,
  refreshSubmission,
  submissions,
  chainIdToUse,
  tokenSymbolOrAddress,
  onSuccess = () => {},
  onError = () => {}
}: Props) {
  const { data: existingSafesData, mutate: refreshSafes } = useMultiWalletSigs();
  const { account, chainId, signer } = useWeb3Account();
  const { user } = useUser();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };
  const [sendingTx, setSendingTx] = useState(false);

  const safeApiClient = useMemo(() => {
    return getSafeApiClient({ chainId: chainIdToUse });
  }, [chainIdToUse]);

  const { data: safeInfos } = useSWR(
    account && chainIdToUse ? `/connected-gnosis-safes/${account}/${chainIdToUse}` : null,
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    () =>
      safeApiClient
        .getSafesByOwner(getAddress(account!))
        .then(async (response) =>
          Promise.all(response.safes.map((safeAddress) => safeApiClient.getSafeInfo(safeAddress)))
        )
  );
  useEffect(() => {
    // This allows auto-syncing of safes, so the user does not need to visit their account to setup their safes
    if (safeInfos && existingSafesData && user) {
      const safesToAdd: Parameters<(typeof charmClient)['gnosisSafe']['setMyGnosisSafes']>[0] = [];

      for (const foundSafe of safeInfos) {
        if (
          foundSafe.owners.some((owner) => lowerCaseEqual(owner, account as string)) &&
          !existingSafesData.some((_existingSafe) => lowerCaseEqual(_existingSafe.address, foundSafe.address))
        ) {
          safesToAdd.push({
            address: foundSafe.address,
            userId: user.id,
            chainId: chainIdToUse,
            isHidden: false,
            owners: foundSafe.owners,
            threshold: foundSafe.nonce
          });
        }
      }

      if (safesToAdd.length) {
        charmClient.gnosisSafe.setMyGnosisSafes([...safesToAdd, ...existingSafesData]).then(() => refreshSafes());
      }
    }
  }, [safeInfos?.length, existingSafesData?.length, user, chainIdToUse]);

  const safeDataRecord =
    existingSafesData?.reduce<Record<string, UserGnosisSafe>>((record, userGnosisSafe) => {
      if (!record[userGnosisSafe.address]) {
        record[userGnosisSafe.address] = userGnosisSafe;
      }
      return record;
    }, {}) ?? {};

  const [paymentMethods] = usePaymentMethods();

  const makePayment = async (submission: Application) => {
    const reward = rewards.find((_reward) => _reward.id === submission.bountyId);
    if (!reward) {
      onError('Invalid application');
      return;
    }

    if (!reward.rewardAmount) {
      onError('Invalid reward amount');
      return;
    }

    if (!chainIdToUse) {
      onError('Please set up a chain for this payment.');
      return;
    }

    const chainToUse = getChainById(chainIdToUse);

    if (!signer) {
      onError('Please make sure you are connected to a supported network and your wallet is unlocked.');
      return;
    }

    try {
      setSendingTx(true);

      if (chainIdToUse !== chainId) {
        await switchActiveNetwork(chainIdToUse);
      }

      const receiver = submission.walletAddress as string;

      let receiverAddress = receiver;

      if (receiver.endsWith('.eth') && ethers.utils.isValidName(receiver)) {
        const resolvedWalletAddress = await charmClient.resolveEnsName(receiver);
        if (resolvedWalletAddress === null) {
          onError(`Could not resolve ENS name ${receiver}`);
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
            onError(
              `Token information is missing. Please go to payment methods to configure this payment method using contract address ${tokenSymbolOrAddress} on chain: ${chainIdToUse}`
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
        onSuccess(tx.hash, chainToUse!.chainId);
      } else {
        const tx = await signer.sendTransaction({
          to: receiverAddress,
          value: parseEther(reward.rewardAmount.toString())
        });

        onSuccess(tx.hash, chainIdToUse);
      }
    } catch (error: any) {
      const { message, level } = getPaymentErrorMessage(error);
      log.warn(`Error sending payment on blockchain: ${message}`, {
        amount: reward.rewardAmount.toString(),
        chainId,
        error
      });
      onError(message, level);
    } finally {
      setSendingTx(false);
    }
  };

  const hasSafes = Boolean(safeInfos?.length);

  if (!account || !chainId || !signer) {
    return (
      <div>
        <Tooltip title='Your wallet must be unlocked to pay for this reward'>
          <OpenWalletSelectorButton label='Unlock Wallet' />
        </Tooltip>
      </div>
    );
  }

  const chainInfo = getChainById(chainIdToUse as number);

  return (
    <>
      <Button
        loading={sendingTx}
        color='primary'
        endIcon={hasSafes && !sendingTx ? <KeyboardArrowDownIcon /> : null}
        size='small'
        onClick={async (e: MouseEvent<HTMLButtonElement>) => {
          if (!hasSafes) {
            for (const submission of submissions) {
              await makePayment(submission);
            }
          } else {
            handleClick(e);
          }
        }}
      >
        Send Payment
      </Button>
      {hasSafes && (
        <Menu id='bounty-payment' anchorEl={anchorEl} open={open} onClose={handleClose}>
          <MenuItem dense sx={{ pointerEvents: 'none', color: 'secondary.main' }}>
            Connected wallet
          </MenuItem>
          <MenuItem
            dense
            onClick={async () => {
              for (const submission of submissions) {
                await makePayment(submission);
              }
              handleClose();
            }}
          >
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
                rewards={rewards}
                label={safeDataRecord[safeInfo.address]?.name || shortenHex(safeInfo.address)}
                onClick={() => {
                  handleClose();
                }}
                onError={onError}
                safeInfo={safeInfo}
                submissions={submissions}
                refreshSubmission={refreshSubmission}
              />
            ))}
        </Menu>
      )}
    </>
  );
}
