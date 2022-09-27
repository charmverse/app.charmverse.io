import PublishIcon from '@mui/icons-material/ElectricBolt';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import { Typography } from '@mui/material';
import ListItemText from '@mui/material/ListItemText';
import charmClient from 'charmClient';
import Link from 'components/common/Link';
import { LoadingIcon } from 'components/common/LoadingComponent';
import { Modal } from 'components/common/Modal';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { usePages } from 'hooks/usePages';
import type { SnapshotProposal } from 'lib/snapshot';
import { getSnapshotProposal } from 'lib/snapshot';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useEffect, useState } from 'react';
import PublishingForm from './PublishingForm';

export default function PublishToSnapshot ({ pageId, typography = false }: { typography?: boolean, pageId: string}) {
  const { pages, setPages } = usePages();
  const page = pages[pageId]!;

  const [checkingProposal, setCheckingProposal] = useState(!!page.snapshotProposalId);
  const [proposal, setProposal] = useState<SnapshotProposal | null>(null);
  const [currentSpace] = useCurrentSpace();

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
    <>
      {
      checkingProposal && (
        <>
          <LoadingIcon size={18} sx={{ mr: 1 }} />
          {typography ? <Typography>Checking proposal</Typography> : <ListItemText primary='Checking proposal' />}
        </>
      )
    }
      {
      !checkingProposal && !proposal && (
        <>
          <PublishIcon
            fontSize='small'
            sx={{
              mr: 1
            }}
            onClick={open}
          />
          {typography ? <Typography onClick={open}>Publish to Snapshot</Typography> : <ListItemText onClick={open} primary='Publish to Snapshot' />}

          <Modal size='large' open={isOpen} onClose={close} title={`Publish to Snapshot ${currentSpace?.snapshotDomain ? `(${currentSpace.snapshotDomain})` : ''}`}>
            <PublishingForm onSubmit={close} page={page} />
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
          {typography ? <Typography>View on Snapshot</Typography> : <ListItemText primary='View on Snapshot' />}
        </Link>
      )
    }
    </>
  );
}
