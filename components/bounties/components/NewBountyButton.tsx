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
import { usePages } from 'hooks/usePages';

export default function NewBountyButton () {
  const { user } = useUser();
  const [currentSpace] = useCurrentSpace();
  const [activeBountyPage, setActiveBountyPage] = useState<{page: Page, bounty: BountyWithDetails} | null>(null);
  const [currentUserPermissions] = useCurrentSpacePermissions();
  const suggestBounties = currentUserPermissions?.createBounty === false;
  const { setBounties } = useBounties();
  const { setPages } = usePages();

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
      setPages((pages) => ({ ...pages, [createdBounty.page.id]: createdBounty.page }));
      setBounties((bounties) => [...bounties, createdBounty]);
      setActiveBountyPage({
        bounty: createdBounty,
        page: createdBounty.page
      });
    }
  }

  return (
    <>
      <Button onClick={onClickCreate}>
        {suggestBounties ? 'Suggest Bounty' : 'Create Bounty'}
      </Button>
      {activeBountyPage
      && (
      <PageDialog
        hideToolsMenu={suggestBounties}
        page={activeBountyPage.page}
        onClose={() => setActiveBountyPage(null)}
      />
      )}
    </>
  );
}
