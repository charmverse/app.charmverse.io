import { Box, Typography } from '@mui/material';
import type { BountyStatus } from '@prisma/client';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

import { usePageDialog } from 'components/common/PageDialog/hooks/usePageDialog';
import { useBounties } from 'hooks/useBounties';
import { usePages } from 'hooks/usePages';
import type { BountyWithDetails } from 'lib/bounties';
import type { PageMeta } from 'lib/pages';

import BountyCard from './BountyCard';
import { BountyStatusChip } from './BountyStatusBadge';

const bountyStatuses: BountyStatus[] = ['open', 'inProgress', 'complete', 'paid', 'suggestion'];

interface Props {
  bounties: BountyWithDetails[];
  publicMode?: boolean;
}

export default function BountiesKanbanView({ bounties, publicMode }: Props) {
  const { deletePage, pages } = usePages();
  const { showPage } = usePageDialog();
  const { setBounties } = useBounties();
  const router = useRouter();

  function onClickDelete(bountyId: string) {
    setBounties((_bounties) => _bounties.filter((_bounty) => _bounty.id !== bountyId));
    deletePage({ pageId: bountyId });
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

  function onClose() {
    router.push({ pathname: router.pathname, query: { domain: router.query.domain } });
  }

  function openPage(bountyId: string) {
    router.push({
      pathname: router.pathname,
      query: { ...router.query, bountyId }
    });
  }

  useEffect(() => {
    if (typeof router.query.bountyId === 'string') {
      showPage({
        bountyId: router.query.bountyId,
        readOnly: publicMode,
        onClose
      });
    }
  }, [router.query.bountyId]);

  return (
    <div className='Kanban'>
      {/* include ViewHeader to include the horizontal line */}
      <div className='ViewHeader' />
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
              .filter((bounty) => Boolean(pages[bounty.page?.id]) && pages[bounty.page.id]?.deletedAt === null)
              .map((bounty) => (
                <BountyCard
                  onDelete={onClickDelete}
                  readOnly={!!publicMode}
                  key={bounty.id}
                  bounty={bounty}
                  page={pages[bounty.page.id] as PageMeta}
                  onClick={() => {
                    openPage(bounty.id);
                  }}
                />
              ))}
          </div>
        ))}
      </div>
    </div>
  );
}
