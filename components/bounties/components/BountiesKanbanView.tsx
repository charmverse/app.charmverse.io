import { Box, List, ListItemButton, ListItemText, Typography } from '@mui/material';
import { BountyStatus, Page } from '@prisma/client';
import PageDialog from 'components/common/Page/PageDialog';
import { BountyWithDetails } from 'models';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { usePages } from 'hooks/usePages';
import { getUriWithParam } from 'lib/utilities/strings';
import { silentlyUpdateURL } from 'lib/browser';
import DeleteIcon from '@mui/icons-material/Delete';
import { Utils } from 'components/common/BoardEditor/focalboard/src/utils';
import { useSnackbar } from 'hooks/useSnackbar';
import LinkIcon from '@mui/icons-material/Link';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import charmClient from 'charmClient';
import { BountyStatusChip } from './BountyStatusBadge';
import BountyCard from './BountyCard';

const bountyStatuses: BountyStatus[] = ['open', 'inProgress', 'complete', 'paid', 'suggestion'];

interface Props {
  bounties: BountyWithDetails[];
  refreshBounty?: (bountyId: string) => void
}

export default function BountiesKanbanView ({ bounties, refreshBounty }: Omit<Props, 'publicMode'>) {
  const [bountyPage, setBountyPage] = useState<Page | null>(null);
  const [selectedBounty, setSelectedBounty] = useState<BountyWithDetails | null>(null);
  const { pages, deletePage } = usePages();

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

  async function closeBounty (bountyId: string) {
    await charmClient.closeBounty(bountyId);
    if (refreshBounty) {
      refreshBounty(bountyId);
    }
  }

  const { showMessage } = useSnackbar();

  function closePopup () {
    setBountyPage(null);
    const newUrl = getUriWithParam(window.location.href, { bountyId: null });
    silentlyUpdateURL(newUrl);
  }

  function showBounty (bountyId: string | null) {
    const bounty = bounties.find(b => b.id === bountyId) ?? null;
    const page = (bounty?.page.id && pages[bounty.page.id]) || null;
    const newUrl = getUriWithParam(window.location.href, { bountyId });
    silentlyUpdateURL(newUrl);
    setBountyPage(page);
    setSelectedBounty(bounty);
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
            {bountiesGroupedByStatus[bountyStatus].filter(bounty => Boolean(pages[bounty.page?.id])
              && pages[bounty.page.id]?.deletedAt === null).map(bounty => (
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

      {bountyPage && selectedBounty && (
      <PageDialog
        toolsMenu={(
          <List dense>
            <ListItemButton onClick={async () => {
              await deletePage({
                pageId: bountyPage.id
              });
              closePopup();
            }}
            >
              <DeleteIcon
                sx={{
                  mr: 1
                }}
                fontSize='small'
              />
              <ListItemText primary='Delete' />
            </ListItemButton>
            <ListItemButton onClick={() => {
              Utils.copyTextToClipboard(window.location.href);
              showMessage('Copied card link to clipboard', 'success');
            }}
            >
              <LinkIcon
                sx={{
                  mr: 1
                }}
                fontSize='small'
              />
              <ListItemText primary='Copy link' />
            </ListItemButton>
            <ListItemButton disabled={selectedBounty.status === 'complete'} onClick={() => closeBounty(selectedBounty.id)}>
              <CheckCircleIcon
                sx={{
                  mr: 1
                }}
                fontSize='small'
              />
              <ListItemText primary='Mark complete' />
            </ListItemButton>
          </List>
      )}
        page={bountyPage}
        onClose={closePopup}
      />
      )}
    </div>
  );
}
