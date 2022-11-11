import { useRouter } from 'next/router';

import charmClient from 'charmClient';
import Button from 'components/common/Button';
import { usePageDialog } from 'components/common/PageDialog/hooks/usePageDialog';
import { useBounties } from 'hooks/useBounties';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useCurrentSpacePermissions } from 'hooks/useCurrentSpacePermissions';
import { usePages } from 'hooks/usePages';
import { useUser } from 'hooks/useUser';
import type { BountyWithDetails } from 'lib/bounties';
import { setUrlWithoutRerender } from 'lib/utilities/browser';

export default function NewBountyButton () {
  const { user } = useUser();
  const router = useRouter();
  const currentSpace = useCurrentSpace();
  const [currentUserPermissions] = useCurrentSpacePermissions();
  const suggestBounties = currentUserPermissions?.createBounty === false;
  const { setBounties } = useBounties();
  const { mutatePage } = usePages();
  const { showPage } = usePageDialog();

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
      mutatePage(createdBounty.page);
      setBounties((bounties) => [...bounties, createdBounty]);
      showPage({
        pageId: createdBounty.page.id,
        hideToolsMenu: suggestBounties,
        onClose () {
          setUrlWithoutRerender(router.pathname, { bountyId: null });
        }
      });
      setUrlWithoutRerender(router.pathname, { bountyId: createdBounty.page.id });
    }
  }

  return (
    <Button onClick={onClickCreate}>
      {suggestBounties ? 'Suggest Bounty' : 'Create Bounty'}
    </Button>
  );
}
