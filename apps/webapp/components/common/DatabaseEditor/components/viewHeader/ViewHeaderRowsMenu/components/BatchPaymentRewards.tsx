import type { Application } from '@charmverse/core/prisma-client';
import PaymentIcon from '@mui/icons-material/Payment';
import { Tooltip } from '@mui/material';
import { getChainById } from '@packages/blockchain/connectors/chains';
import type { RewardWithUsers } from '@packages/lib/rewards/interfaces';
import { isTruthy } from '@packages/utils/types';
import { useMemo, useState } from 'react';

import { OpenWalletSelectorButton } from 'components/_app/Web3ConnectionManager/components/WalletSelectorModal/OpenWalletSelectorButton';
import { Button } from 'components/common/Button';
import LoadingComponent from 'components/common/LoadingComponent';
import { GnosisSafesList } from 'components/rewards/components/RewardApplicationPage/components/GnosisSafesList';
import { useRewards } from 'components/rewards/hooks/useRewards';
import { useGnosisSafes } from 'hooks/useGnosisSafes';
import { usePages } from 'hooks/usePages';
import { useWeb3Account } from 'hooks/useWeb3Account';

import { PropertyMenu } from './PropertyMenu';

type ApplicationLite = Pick<Application, 'id' | 'walletAddress' | 'bountyId' | 'createdBy'>;

export function BatchPaymentRewards({ checkedIds }: { checkedIds: string[] }) {
  const { pages } = usePages();
  const { rewards, mutateRewards } = useRewards();
  const { account, chainId } = useWeb3Account();
  const safesRecord = useGnosisSafes();
  const [isMutating, setIsMutating] = useState(false);

  const filteredRewards = useMemo(() => {
    const rewardsRecord =
      rewards?.filter(isTruthy)?.reduce<
        Record<
          string,
          RewardWithUsers & {
            submissions: ApplicationLite[];
          }
        >
      >((acc, reward) => {
        const completedApplications = reward.applications.filter((application) => application.status === 'complete');
        acc[reward.id] = {
          ...reward,
          submissions: completedApplications.map((application) => ({
            ...application,
            bountyId: reward.id
          }))
        };
        return acc;
      }, {}) ?? {};

    const _filteredRewards = (checkedIds
      ?.map((pageId) => {
        const page = pages[pageId];
        if (page && page.type === 'bounty' && page.bountyId) {
          return rewardsRecord[page.bountyId];
        }
        return null;
      })
      .filter(
        (reward) =>
          isTruthy(reward) && reward.rewardType === 'token' && reward.chainId === chainId && reward.submissions.length
      ) ?? []) as (RewardWithUsers & {
      submissions: ApplicationLite[];
    })[];

    return _filteredRewards;
  }, [pages, rewards, checkedIds, chainId]);

  if (!account || !chainId) {
    return (
      <Tooltip title='Your wallet must be unlocked to pay for rewards'>
        <OpenWalletSelectorButton
          sx={{
            minWidth: 'fit-content'
          }}
          size='small'
          label='Unlock Wallet'
        />
      </Tooltip>
    );
  }

  const safesInChain = Object.values(safesRecord).filter((safe) => safe.chainId === chainId);

  const submissions = filteredRewards.flatMap((reward) => reward.submissions);

  let disabledTooltip = '';

  if (safesInChain.length === 0) {
    disabledTooltip = `No safes found on the ${getChainById(chainId)?.chainName} network`;
  } else if (checkedIds.length === 0) {
    disabledTooltip = 'No rewards selected';
  } else if (filteredRewards.length === 0) {
    disabledTooltip = `Selected rewards are either not token rewards, not on the ${
      getChainById(chainId)?.chainName
    } network or don't have any completed submissions`;
  }

  if (disabledTooltip) {
    return (
      <Button color='secondary' size='small' variant='outlined' disabled disabledTooltip={disabledTooltip}>
        Send Payment
      </Button>
    );
  }

  return (
    <PropertyMenu
      disabledTooltip={isMutating ? 'Processing...' : ''}
      lastChild={false}
      propertyTemplate={{
        icon: isMutating ? <LoadingComponent size={15} /> : <PaymentIcon sx={{ fontSize: '16px !important' }} />,
        name: isMutating ? 'Completing payment' : `Send payment (${submissions.length})`
      }}
    >
      {({ closeMenu }) => {
        return (
          <GnosisSafesList
            onClick={() => {
              setIsMutating(true);
            }}
            disabled={isMutating}
            refreshSubmissions={mutateRewards}
            rewards={filteredRewards}
            onSuccess={() => {
              setIsMutating(false);
              closeMenu();
            }}
            onError={() => {
              setIsMutating(false);
              closeMenu();
            }}
          />
        );
      }}
    </PropertyMenu>
  );
}
