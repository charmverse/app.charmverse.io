import PublishIcon from '@mui/icons-material/ElectricBolt';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import { MenuItem } from '@mui/material';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import { Page } from '@prisma/client';
import charmClient from 'charmClient';
import Link from 'components/common/Link';
import { LoadingIcon } from 'components/common/LoadingComponent';
import { Modal } from 'components/common/Modal';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { usePages } from 'hooks/usePages';
import { getSnapshotProposal, SnapshotProposal } from 'lib/snapshot';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useEffect, useState } from 'react';
import PublishingForm from './PublishingForm';

export default function PublishToSnapshot ({ page, disabled = false, button = true }: {button?: boolean, disabled?: boolean, page: Page}) {

  const [checkingProposal, setCheckingProposal] = useState(!!page.snapshotProposalId);
  const [proposal, setProposal] = useState<SnapshotProposal | null>(null);
  const { pages, setPages } = usePages();
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

  const content = (
    <>
      {
      checkingProposal && (
        <>
          <LoadingIcon size={18} sx={{ mr: 1 }} />
          <ListItemText primary='Checking proposal' />
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
          <ListItemText onClick={open} primary='Publish to Snapshot' />

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
          <ListItemText primary='View on Snapshot' />

        </Link>
      )
    }
    </>
  );

  return (
    button ? (
      <ListItemButton disabled={disabled}>
        {content}
      </ListItemButton>
    ) : (
      <MenuItem disabled={disabled}>
        {content}
      </MenuItem>
    )
  );
}
