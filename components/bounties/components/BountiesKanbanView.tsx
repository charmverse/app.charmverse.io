import type { PageMeta } from '@charmverse/core/pages';
import type { BountyStatus } from '@charmverse/core/prisma';
import { Box, Typography } from '@mui/material';
import { useRouter } from 'next/router';

import { useBounties } from 'hooks/useBounties';
import { usePages } from 'hooks/usePages';
import type { BountyWithDetails } from 'lib/bounties';

import BountyKanbanCard from './BountyKanbanCard';
import { BountyStatusChip } from './BountyStatusBadge';

const bountyStatuses: BountyStatus[] = ['open', 'inProgress', 'complete', 'paid', 'suggestion'];

interface Props {
  bounties: BountyWithDetails[];
  publicMode?: boolean;
}

export function BountiesKanbanView({ bounties, publicMode }: Props) {
  const { deletePage, pages } = usePages();
  const { setBounties } = useBounties();
  const router = useRouter();

  function onClickDelete(pageId: string) {
    setBounties((_bounties) => _bounties.filter((_bounty) => _bounty.page.id !== pageId));
    deletePage({ pageId });
  }

  const bountiesGroupedByStatus = bounties.reduce<Record<BountyStatus, BountyWithDetails[]>>(
    (record, bounty) => {
      record[bounty.status].push(bounty);
      return record;
    },
    {
      complete: [],
      inProgress: [],
      open: [],
      paid: [],
      suggestion: []
    }
  );

  function openPage(bountyId: string) {
    router.push({
      pathname: router.pathname,
      query: { ...router.query, bountyId }
    });
  }
  return (
    <div className='Kanban'>
      {/* include ViewHeader to include the horizontal line */}
      <div className='octo-board-header'>
        {bountyStatuses.map((bountyStatus) => (
          <Box className='octo-board-header-cell' key={bountyStatus}>
            <BountyStatusChip status={bountyStatus} />
            <Typography variant='body2' color='secondary' px={2}>
              {bountiesGroupedByStatus[bountyStatus].length}
            </Typography>
          </Box>
        ))}
      </div>
      <div className='octo-board-body'>
        {bountyStatuses.map((bountyStatus) => (
          <div className='octo-board-column' key={bountyStatus}>
            {bountiesGroupedByStatus[bountyStatus]
              .filter((bounty) => Boolean(pages[bounty.page.id]) && !pages[bounty.page.id]?.deletedAt)
              .map((bounty) => (
                <BountyKanbanCard
                  onDelete={onClickDelete}
                  readOnly={!!publicMode}
                  key={bounty.id}
                  bounty={bounty}
                  page={pages[bounty.page.id] as PageMeta}
                  onClick={() => {
                    openPage(bounty.page.id);
                  }}
                />
              ))}
          </div>
        ))}
      </div>
    </div>
  );
}
