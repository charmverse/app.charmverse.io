import { Box, Typography } from '@mui/material';
import { BountyStatus, Page } from '@prisma/client';
import charmClient from 'charmClient';
import PageDialog from 'components/common/Page/PageDialog';
import { usePages } from 'hooks/usePages';
import { silentlyUpdateURL } from 'lib/browser';
import { getUriWithParam } from 'lib/utilities/strings';
import { BountyWithDetails } from 'models';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import BountyCard from './BountyCard';
import { BountyStatusChip } from './BountyStatusBadge';

const bountyStatuses: BountyStatus[] = ['open', 'inProgress', 'complete', 'paid', 'suggestion'];

interface Props {
  bounties: BountyWithDetails[];
  refreshBounty?: (bountyId: string) => void
}

export default function BountiesKanbanView ({ bounties, refreshBounty }: Omit<Props, 'publicMode'>) {
  const [activeBountyPage, setActiveBountyPage] = useState<{page: Page, bounty: BountyWithDetails} | null>(null);
  const { pages, deletePage } = usePages();
  const router = useRouter();
  const [initialBountyId, setInitialBountyId] = useState(router.query.bountyId as string || '');

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

  async function closeBounty (bountyId: string) {
    await charmClient.bounties.closeBounty(bountyId);
    if (refreshBounty) {
      refreshBounty(bountyId);
    }
  }

  function closePopup () {
    setActiveBountyPage(null);
    const newUrl = getUriWithParam(window.location.href, { bountyId: null });
    silentlyUpdateURL(newUrl);
  }

  function showBounty (bounty: BountyWithDetails) {
    const page = (bounty?.page.id && pages[bounty.page.id]) || null;
    const newUrl = getUriWithParam(window.location.href, { bountyId: bounty.id });
    silentlyUpdateURL(newUrl);
    if (page) {
      setActiveBountyPage({
        bounty,
        page
      });
    }
  }

  useEffect(() => {
    const bounty = bounties.find(b => b.id === initialBountyId) ?? null;
    if (bounty) {
      showBounty(bounty);
      setInitialBountyId('');
    }
  }, [bounties]);

  return (
    <div className='Kanban'>
      {/* include ViewHeader to include the horizontal line */}
      <div className='ViewHeader' />
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
            {bountiesGroupedByStatus[bountyStatus].filter(bounty => Boolean(pages[bounty.page?.id])
              && pages[bounty.page.id]?.deletedAt === null).map(bounty => (
                <BountyCard
                  key={bounty.id}
                  bounty={bounty}
                  page={pages[bounty.page.id] as Page}
                  onClick={() => {
                    showBounty(bounty);
                  }}
                />
            ))}
          </div>
        ))}
      </div>

      {activeBountyPage?.page && activeBountyPage?.bounty && (
        <PageDialog
          page={activeBountyPage.page}
          onClickDelete={() => {
            deletePage({
              pageId: activeBountyPage.page.id
            });
          }}
          onClose={() => {
            closePopup();
          }}
          bounty={activeBountyPage?.bounty}
          onMarkCompleted={() => {
            closeBounty(activeBountyPage?.bounty.id);
          }}
        />
      )}
    </div>
  );
}
