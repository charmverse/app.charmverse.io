import { useRouter } from 'next/router';

import charmClient from 'charmClient';
import { Button } from 'components/common/Button';
import { useBounties } from 'hooks/useBounties';
import { useCharmRouter } from 'hooks/useCharmRouter';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useCurrentSpacePermissions } from 'hooks/useCurrentSpacePermissions';
import { usePages } from 'hooks/usePages';
import { useUser } from 'hooks/useUser';
import type { BountyWithDetails } from 'lib/bounties';

export function NewBountyButton() {
  const { user } = useUser();
  const { updateURLQuery } = useCharmRouter();
  const { space: currentSpace } = useCurrentSpace();
  const [currentUserPermissions] = useCurrentSpacePermissions();
  const suggestBounties = currentUserPermissions?.createBounty === false;
  const { setBounties } = useBounties();
  const { mutatePage } = usePages();

  async function onClickCreate() {
    if (currentSpace && user) {
      let createdBounty: BountyWithDetails;

      if (suggestBounties) {
        createdBounty = await charmClient.bounties.createBounty({
          chainId: 1,
          status: 'suggestion',
          spaceId: currentSpace.id,
          createdBy: user.id,
          rewardAmount: 0,
          rewardToken: 'ETH',
          permissions: {
            submitter: [
              {
                group: 'space',
                id: currentSpace.id
              }
            ]
          }
        });
      } else {
        createdBounty = await charmClient.bounties.createBounty({
          chainId: 1,
          status: 'open',
          spaceId: currentSpace.id,
          createdBy: user.id,
          rewardAmount: 1,
          rewardToken: 'ETH',
          permissions: {
            submitter: [
              {
                group: 'space',
                id: currentSpace.id
              }
            ]
          }
        });
      }
      mutatePage(createdBounty.page);
      updateURLQuery({ bountyId: createdBounty.page.id });
      setBounties((bounties) => [...bounties, createdBounty]);
    }
  }

  return (
    <Button data-test='create-suggest-bounty' onClick={onClickCreate}>
      {suggestBounties ? 'Suggest Bounty' : 'Create Bounty'}
    </Button>
  );
}
