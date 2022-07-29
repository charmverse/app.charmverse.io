
import { BountyStatus, Page } from '@prisma/client';
import PageDialog from 'components/common/Page/PageDialog';
import { BountyWithDetails } from 'models';
import { useState } from 'react';
import { usePages } from 'hooks/usePages';
import BountyCard from './BountyCard';
import { BountyStatusChip } from './BountyStatusBadge';

const bountyStatuses: BountyStatus[] = ['open', 'inProgress', 'complete', 'paid', 'suggestion'];

interface Props {
  onSelectBounty?: (bounty: BountyWithDetails) => void,
  bounties: BountyWithDetails[]
}

export default
function BountiesKanban ({ bounties, onSelectBounty }: Omit<Props, 'publicMode'>) {

  const [activeBountyPage, setBountyPage] = useState<Page | null>(null);
  const { pages } = usePages();

  const bountiesGroupedByStatus = bounties.reduce<Record<BountyStatus, BountyWithDetails[]>>((record, bounty) => {
    record[bounty.status].push(bounty);
    return record;
  }, {
    complete: [],
    inProgress: [],
    open: [],
    paid: [],
    suggestion: []
  });

  return (
    <div className='Kanban'>
      <div className='octo-board-header'>
        {bountyStatuses.map(bountyStatus => (
          <div className='octo-board-header-cell' key={bountyStatus}>
            <BountyStatusChip status={bountyStatus} />
          </div>
        ))}
      </div>
      <div className='octo-board-body'>
        {bountyStatuses.map(bountyStatus => (
          <div className='octo-board-column' key={bountyStatus}>
            {bountiesGroupedByStatus[bountyStatus].filter(bounty => Boolean(pages[bounty.page?.id])).map(bounty => (
              <BountyCard
                key={bounty.id}
                bounty={bounty}
                page={pages[bounty.page.id] as Page}
                onClick={() => {
                  onSelectBounty?.(bounty);
                  const bountyPage = pages[bounty.page?.id] as Page;
                  setBountyPage(bountyPage);
                }}
              />
            ))}
          </div>
        ))}
      </div>

      {activeBountyPage && <PageDialog page={activeBountyPage} onClose={() => setBountyPage(null)} />}
    </div>
  );
}
