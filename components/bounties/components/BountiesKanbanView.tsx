import { Box, Typography } from '@mui/material';
import type { BountyStatus } from '@prisma/client';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import { usePageDialog } from 'components/common/PageDialog/hooks/usePageDialog';
import { usePages } from 'hooks/usePages';
import type { BountyWithDetails } from 'lib/bounties';
import type { PageMeta } from 'lib/pages';
import { setUrlWithoutRerender } from 'lib/utilities/browser';

import BountyCard from './BountyCard';
import { BountyStatusChip } from './BountyStatusBadge';

const bountyStatuses: BountyStatus[] = ['open', 'inProgress', 'complete', 'paid', 'suggestion'];

interface Props {
  bounties: BountyWithDetails[];
  publicMode?: boolean;
}

export default function BountiesKanbanView ({ bounties, publicMode }: Props) {
  const { pages } = usePages();
  const { showPage } = usePageDialog();

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

  function onClose () {
    setUrlWithoutRerender(router.pathname, { bountyId: null });
  }

  function showBounty (bounty: BountyWithDetails) {
    setUrlWithoutRerender(router.pathname, { bountyId: bounty.id });
    if (bounty?.id) {
      showPage({
        bountyId: bounty.id,
        readOnly: publicMode,
        onClose
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
                  page={pages[bounty.page.id] as PageMeta}
                  onClick={() => {
                    showBounty(bounty);
                  }}
                />
            ))}
          </div>
        ))}
      </div>

    </div>
  );
}
