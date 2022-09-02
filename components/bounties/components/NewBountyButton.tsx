import charmClient from 'charmClient';
import Button from 'components/common/Button';
import PageDialog from 'components/common/PageDialog';
import { useBounties } from 'hooks/useBounties';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useCurrentSpacePermissions } from 'hooks/useCurrentSpacePermissions';
import { usePages } from 'hooks/usePages';
import { useUser } from 'hooks/useUser';
import { IPageWithPermissions } from 'lib/pages';
import { BountyWithDetails } from 'models';
import { useState } from 'react';

export default function NewBountyButton () {
  const { user } = useUser();
  const [currentSpace] = useCurrentSpace();
  const [activeBountyPage, setActiveBountyPage] = useState<{page: IPageWithPermissions, bounty: BountyWithDetails} | null>(null);
  const [currentUserPermissions] = useCurrentSpacePermissions();
  const suggestBounties = currentUserPermissions?.createBounty === false;
  const { setBounties } = useBounties();
  const { setPages } = usePages();

  async function onClickCreate () {
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
            submitter: [{
              group: 'space',
              id: currentSpace.id
            }]
          }
        });
      }
      else {
        createdBounty = await charmClient.bounties.createBounty({
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
