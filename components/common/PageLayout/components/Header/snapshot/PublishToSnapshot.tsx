import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import IosShareIcon from '@mui/icons-material/IosShare';
import Box from '@mui/material/Box';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import { Page } from '@prisma/client';
import charmClient from 'charmClient';
import Link from 'components/common/Link';
import { LoadingIcon } from 'components/common/LoadingComponent';
import { Modal } from 'components/common/Modal';
import { usePages } from 'hooks/usePages';
import { getSnapshotProposal, SnapshotProposal } from 'lib/snapshot';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useEffect, useState } from 'react';
import PublishingForm from './PublishingForm';

export default function PublishToSnapshot ({ page }: {page: Page}) {

  const [checkingProposal, setCheckingProposal] = useState(!!page.snapshotProposalId);
  const [proposal, setProposal] = useState<SnapshotProposal | null>(null);
  const { pages, setPages } = usePages();

  const {
    isOpen,
    open,
    close
  } = usePopupState({ variant: 'popover', popupId: 'publish-proposal' });

  async function verifyProposal (proposalId: string) {
    const snapshotProposal = await getSnapshotProposal(proposalId);

    if (!snapshotProposal) {
      const pageWithoutSnapshotId = await charmClient.updatePageSnapshotData(page.id, { snapshotProposalId: null });
      setPages({
        ...pages,
        [page.id]: pageWithoutSnapshotId
      });
    }

    setProposal(snapshotProposal);
    setCheckingProposal(false);
  }

  useEffect(() => {
    if (page?.snapshotProposalId) {
      verifyProposal(page?.snapshotProposalId);
    }
    else {
      setProposal(null);
    }

  }, [page, page?.snapshotProposalId]);

  return (
    <ListItemButton>

      {

      checkingProposal && (
        <>
          <LoadingIcon size={18} sx={{ mr: 1 }} />
          <ListItemText primary='Checking proposal' />
          {

          /**
           *   <LoadingComponent>
            <ListItemText primary='Checking proposal' />
          </LoadingComponent>

           */
        }

        </>
      )
      }

      {
        !checkingProposal && !proposal && (
          <>
            <IosShareIcon
              fontSize='small'
              sx={{
                mr: 1
              }}
              onClick={open}
            />
            <ListItemText onClick={open} primary='Publish to snapshot' />

            <Modal open={isOpen} onClose={close} title='Publish to snapshot'>
              <Box sx={{ maxHeight: '80vh', margin: 'auto', overflowY: 'auto' }}>
                <PublishingForm onSubmit={close} page={page} />
              </Box>
            </Modal>
          </>
        )
      }

      {
      !checkingProposal && proposal && (
      <Link sx={{ display: 'flex', verticalAlign: 'center' }} color='textPrimary' external target='_blank' href={`https://snapshot.org/#/${proposal.space.id}/proposal/${proposal.id}`}>
        <ExitToAppIcon
          fontSize='small'
          sx={{
            m: 'auto',
            mr: 1
          }}

        />
        <ListItemText primary='View on Snapshot' />

      </Link>
      )
      }

    </ListItemButton>

  );
}
