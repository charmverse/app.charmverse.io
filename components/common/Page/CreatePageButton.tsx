import { useState } from 'react';
import { Page } from '@prisma/client';
import Button from 'components/common/Button';
import { addPage } from 'lib/pages/addPage';
import { useUser } from 'hooks/useUser';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useCurrentSpacePermissions } from 'hooks/useCurrentSpacePermissions';
import { useBounties } from 'hooks/useBounties';
import charmClient from 'charmClient';
import PageDialog from './PageDialog';

interface CreatePageButtonProps {
  type: 'proposal' | 'bounty'
}

export default function CreatePageButton ({ type }: CreatePageButtonProps) {

  const [user] = useUser();
  const [currentSpace] = useCurrentSpace();
  const [page, setPage] = useState<Page | null>(null);
  const [currentUserPermissions] = useCurrentSpacePermissions();
  const suggestBounties = currentUserPermissions?.createBounty === false;
  const { setBounties } = useBounties();

  async function onClickCreate () {
    if (currentSpace && user) {
      if (type === 'proposal') {
        const newPage = await addPage({
          spaceId: currentSpace.id,
          createdBy: user.id,
          type: 'proposal'
        });
        setPage(newPage);
      }
      else if (type === 'bounty') {
        const createdBounty = await charmClient.createBounty({
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
        setBounties((bounties) => [...bounties, createdBounty]);
        setPage(createdBounty.page);
      }
    }
  }

  return (
    <>
      <Button onClick={onClickCreate}>
        {type === 'proposal' ? 'Create Proposal' : 'Create Bounty'}
      </Button>
      {page && <PageDialog page={page} onClose={() => setPage(null)} />}
    </>
  );
}
