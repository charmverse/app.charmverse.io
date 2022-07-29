import { Box, Typography } from '@mui/material';
import { BountyStatus, Page } from '@prisma/client';
import PageDialog from 'components/common/Page/PageDialog';
import { BountyWithDetails } from 'models';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { usePages } from 'hooks/usePages';
import { getUriWithParam } from 'lib/utilities/strings';
import { silentlyUpdateURL } from 'lib/browser';
import BountyCard from './BountyCard';
import { BountyStatusChip } from './BountyStatusBadge';

const bountyStatuses: BountyStatus[] = ['open', 'inProgress', 'complete', 'paid', 'suggestion'];

interface Props {
  bounties: BountyWithDetails[];
}

export default function BountiesKanbanView ({ bounties }: Omit<Props, 'publicMode'>) {

  const [activeBountyPage, setBountyPage] = useState<Page | null>(null);
  const { pages } = usePages();
  const router = useRouter();

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

  function closePopup () {
    setBountyPage(null);
    const newUrl = getUriWithParam(window.location.href, { bountyId: null });
    silentlyUpdateURL(newUrl);
  }

  function showBounty (bountyId: string | null) {
    const bounty = bounties.find(b => b.id === bountyId);
    const bountyPage = (bounty?.page.id && pages[bounty.page.id]) || null;
    const newUrl = getUriWithParam(window.location.href, { bountyId });
    silentlyUpdateURL(newUrl);
    setBountyPage(bountyPage);
  }

  // load bounty from URL
  useEffect(() => {
    const bountyId = router.query.bountyId as string;
    if (bountyId) {
      showBounty(bountyId);
    }
  }, [router.query.bountyId, bounties, pages]);

  return (
    <div className='Kanban'>
      <div className='octo-board-header'>
        {bountyStatuses.map(bountyStatus => (
          <Box className='octo-board-header-cell' key={bountyStatus}>
            <BountyStatusChip status={bountyStatus} />
            <Typography variant='body2' color='secondary' px={2}>
              {bountiesGroupedByStatus[bountyStatus].length}
            </Typography>
          </Box>
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
                  showBounty(bounty.id);
                }}
              />
            ))}
          </div>
        ))}
      </div>

      {activeBountyPage && <PageDialog page={activeBountyPage} onClose={closePopup} />}
    </div>
  );
}
