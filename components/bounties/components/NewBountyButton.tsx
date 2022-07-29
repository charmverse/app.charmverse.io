import { useState } from 'react';
import { Page } from '@prisma/client';
import Button from 'components/common/Button';
import { useUser } from 'hooks/useUser';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useCurrentSpacePermissions } from 'hooks/useCurrentSpacePermissions';
import { useBounties } from 'hooks/useBounties';
import charmClient from 'charmClient';
import { BountyWithDetails } from 'models';
import PageDialog from 'components/common/Page/PageDialog';

export default function NewBountyButton () {
  const [user] = useUser();
  const [currentSpace] = useCurrentSpace();
  const [page, setPage] = useState<Page | null>(null);
  const [currentUserPermissions] = useCurrentSpacePermissions();
  const suggestBounties = currentUserPermissions?.createBounty === false;
  const { setBounties } = useBounties();

  async function onClickCreate () {
    if (currentSpace && user) {
      let createdBounty: BountyWithDetails;

      if (suggestBounties) {
        createdBounty = await charmClient.createBounty({
          chainId: 1,
          status: 'suggestion',
          spaceId: currentSpace.id,
          createdBy: user.id,
          rewardAmount: 0,
          rewardToken: 'ETH',
          permissions: {
            submitter: [{
              group: 'space',
              id: currentSpace.id
            }]
          }
        });
      }
      else {
        createdBounty = await charmClient.createBounty({
          chainId: 1,
          status: 'open',
          spaceId: currentSpace.id,
          createdBy: user.id,
          rewardAmount: 1,
          rewardToken: 'ETH',
          permissions: {
            submitter: [{
              group: 'space',
              id: currentSpace.id
            }]
          }
        });
      }
      setBounties((bounties) => [...bounties, createdBounty]);
      setPage(createdBounty.page);
    }
  }

  return (
    <>
      <Button onClick={onClickCreate}>
        {suggestBounties ? 'Suggest Bounty' : 'Create Bounty'}
      </Button>
      {page && <PageDialog page={page} onClose={() => setPage(null)} />}
    </>
  );
}
