import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import IosShareIcon from '@mui/icons-material/IosShare';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import { Page } from '@prisma/client';
import snapshot from '@snapshot-labs/snapshot.js';
import { useWeb3React } from '@web3-react/core';
import charmClient from 'charmClient';
import Link from 'components/common/Link';
import { LoadingIcon } from 'components/common/LoadingComponent';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { usePages } from 'hooks/usePages';

import { getSnapshotProposal, SnapshotProposal, SnapshotReceipt } from 'lib/snapshot';
import { useEffect, useState } from 'react';
import { bindPopover, usePopupState } from 'material-ui-popup-state/hooks';
import { Modal } from 'components/common/Modal';
import PublishingForm from './PublishingForm';

export default function PublishToSnapshot ({ page }: {page: Page}) {

  const [space] = useCurrentSpace();

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
            />
            <ListItemText onClick={open} primary='Publish to snapshot' />

            <Modal open={isOpen} onClose={close}>
              <PublishingForm onSubmit={close} page={page} />
            </Modal>
          </>
        )
      }

      {
      !checkingProposal && proposal && (
      <Link sx={{ display: 'inline-block' }} external target='_blank' href={`https://snapshot.org/#/${proposal.space.id}/proposal/${proposal.id}`}>
        <ExitToAppIcon
          fontSize='small'
          sx={{
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
