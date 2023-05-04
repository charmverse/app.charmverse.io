import type { Bounty } from '@charmverse/core/prisma';
import type { MetaTransactionData } from '@safe-global/safe-core-sdk-types';
import { getChainById } from 'connectors';
import { ethers } from 'ethers';
import { useMemo, useState } from 'react';
import useSWR from 'swr';

import charmClient from 'charmClient';
import type { MultiPaymentResult } from 'components/bounties/components/MultiPaymentButton';
import { usePaymentMethods } from 'hooks/usePaymentMethods';
import { useWeb3AuthSig } from 'hooks/useWeb3AuthSig';
import useGnosisSigner from 'hooks/useWeb3Signer';
import type { BountyWithDetails } from 'lib/bounties';
import type { SafeData } from 'lib/gnosis';
import { getSafesForAddress } from 'lib/gnosis';
import { eToNumber } from 'lib/utilities/numbers';
import { isTruthy } from 'lib/utilities/types';

import { useBounties } from './useBounties';
import { useCurrentSpace } from './useCurrentSpace';

const ERC20_ABI = ['function transfer(address to, uint256 value)'];

export interface TransactionWithMetadata
  extends MetaTransactionData,
    Pick<Bounty, 'rewardToken' | 'rewardAmount' | 'chainId'> {
  applicationId: string;
  userId: string;
  title: string;
}

export function useMultiBountyPayment({
  bounties,
  postPaymentSuccess
}: {
  postPaymentSuccess?: () => void;
  bounties: BountyWithDetails[];
  selectedApplicationIds?: string[];
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [gnosisSafeData, setGnosisSafeData] = useState<SafeData | null>(null);
  const { setBounties, setCurrentBounty, currentBountyId } = useBounties();
  const { account, chainId } = useWeb3AuthSig();
  const currentSpace = useCurrentSpace();
  const [paymentMethods] = usePaymentMethods();
  const signer = useGnosisSigner();
  const { data: gnosisSafes } = useSWR(
    signer && account && chainId ? `/connected-gnosis-safes/${account}` : null,
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    () => getSafesForAddress({ signer: signer!, chainId: chainId!, address: account! })
  );

  // useEffect(() => {
  //   if (gnosisSafes) {
  //     setGnosisSafeData(safeData[0]);
  //   }
  // }, [safeData]);

  // const gnosisSafeAddress = gnosisSafeData?.address;
  // const gnosisSafeChainId = gnosisSafeData?.chainId;

  // If the bounty is on the same chain as the gnosis safe and the rewardToken of the bounty is the same as the native currency of the gnosis safe chain
  const transactions: ((safeAddress?: string) => TransactionWithMetadata)[] = useMemo(
    () =>
      bounties
        .filter((bounty) => {
          return (
            gnosisSafes?.some((safe) => bounty.chainId === safe.chainId) &&
            isTruthy(bounty.rewardAmount) &&
            isTruthy(bounty.rewardToken) &&
            isTruthy(bounty.chainId)
          );
        })
        .map((bounty) => {
          return bounty.applications
            .filter((application) => application.walletAddress && application.status === 'complete')
            .map((application) => {
              return (safeAddress?: string) => {
                let data = '0x';
                let to = application.walletAddress as string;
                let value = ethers.utils.parseUnits(eToNumber(bounty.rewardAmount as number), 18).toString();

                // assume this is ERC20 if its not a native token
                const isERC20Token =
                  safeAddress && bounty.rewardToken !== getChainById(bounty.chainId as number)?.nativeCurrency.symbol;
                if (isERC20Token) {
                  const paymentMethod = paymentMethods.find((method) => method.contractAddress === bounty.rewardToken);
                  const erc20 = new ethers.utils.Interface(ERC20_ABI);
                  const parsedAmount = ethers.utils
                    .parseUnits(eToNumber(bounty.rewardAmount as number), paymentMethod?.tokenDecimals)
                    .toString();
                  data = erc20.encodeFunctionData('transfer', [application.walletAddress, parsedAmount]);
                  // send the request to the token contract
                  to = bounty.rewardToken as string;
                  value = '0';
                }

                return {
                  // convert to checksum address, or else gnosis-safe will fail
                  to: ethers.utils.getAddress(to),
                  value,
                  data,
                  applicationId: application.id,
                  userId: application.createdBy,
                  chainId: bounty.chainId,
                  rewardAmount: bounty.rewardAmount,
                  rewardToken: bounty.rewardToken,
                  title: bounty.page?.title || 'Untitled'
                };
              };
            });
        })
        .flat(),
    [bounties, gnosisSafes]
  );

  async function onPaymentSuccess(result: MultiPaymentResult) {
    const safeData = gnosisSafes?.find((safe) => safe.address === result.safeAddress);
    if (safeData) {
      setIsLoading(true);
      await Promise.all(
        result.transactions.map(async (transaction) => {
          await charmClient.bounties.recordTransaction({
            applicationId: transaction.applicationId,
            transactionId: result.txHash,
            chainId: safeData.chainId.toString()
          });
          await charmClient.bounties.markSubmissionAsPaid(transaction.applicationId);
        })
      );

      if (currentSpace) {
        charmClient.bounties.listBounties(currentSpace.id).then((_bounties) => {
          setBounties(_bounties);
          const newCurrentBounty = _bounties.find((_bounty) => _bounty.id === currentBountyId);
          if (newCurrentBounty) {
            setCurrentBounty({ ...newCurrentBounty });
          }
        });
      }
      setIsLoading(false);
      postPaymentSuccess?.();
    }
  }

  const isDisabled = transactions.length === 0;

  return {
    isLoading,
    isDisabled,
    transactions,
    onPaymentSuccess,
    gnosisSafes,
    gnosisSafeData,
    setGnosisSafeData
  };
}
