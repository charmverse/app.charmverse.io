import PublishIcon from '@mui/icons-material/ElectricBolt';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import { usePopupState } from 'material-ui-popup-state/hooks';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';

import charmClient from 'charmClient';
import { useUpdateSnapshotProposal } from 'charmClient/hooks/proposals';
import Link from 'components/common/Link';
import { LoadingIcon } from 'components/common/LoadingComponent';
import { Modal } from 'components/common/Modal';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { getSnapshotProposal } from 'lib/snapshot/getProposal';
import type { SnapshotProposal } from 'lib/snapshot/interfaces';

import { PublishingForm } from './PublishingForm';

interface Props {
  pageId: string;
  evaluationId: string;
  proposalId: string;
  snapshotProposalId: string | null;
  renderContent: (props: { onClick?: () => void; label: string; icon: ReactNode }) => ReactNode;
  onPublish?: () => void;
}

export function PublishToSnapshot({
  pageId,
  snapshotProposalId,
  renderContent,
  evaluationId,
  proposalId,
  onPublish = () => null
}: Props) {
  const [checkingProposal, setCheckingProposal] = useState(!!snapshotProposalId);
  const [proposal, setProposal] = useState<SnapshotProposal | null>(null);
  const { space: currentSpace } = useCurrentSpace();
  const { trigger: updateProposalEvaluation } = useUpdateSnapshotProposal({ proposalId });

  const { isOpen, open, close } = usePopupState({ variant: 'popover', popupId: 'publish-proposal' });

  async function verifyProposal(snapshotId: string) {
    const snapshotProposal = await getSnapshotProposal(snapshotId);
    if (!snapshotProposal) {
      if (evaluationId) {
        await updateProposalEvaluation({
          evaluationId,
          snapshotProposalId: null
        });
      } else {
        await charmClient.updatePageSnapshotData(pageId, {
          snapshotProposalId: null
        });
      }
      await charmClient.updatePageSnapshotData(pageId, { snapshotProposalId: null });
    }
    return snapshotProposal;
  }

  useEffect(() => {
    async function init() {
      if (snapshotProposalId) {
        const _proposal = await verifyProposal(snapshotProposalId);
        setProposal(_proposal);
      } else {
        setProposal(null);
      }
      setCheckingProposal(false);
    }
    init();
  }, [snapshotProposalId]);

  return (
    <>
      {checkingProposal && (
        <>
          {renderContent({
            label: 'Checking proposal',
            icon: <LoadingIcon size={18} sx={{ mr: 1 }} />
          })}
        </>
      )}
      {!checkingProposal && !proposal && (
        <>
          {renderContent({
            label: 'Publish to Snapshot',
            onClick: open,
            icon: <PublishIcon fontSize='small' sx={{ mr: 1 }} />
          })}
          <Modal
            size='large'
            open={isOpen && !!pageId}
            onClose={close}
            title={`Publish to Snapshot ${currentSpace?.snapshotDomain ? `(${currentSpace.snapshotDomain})` : ''}`}
          >
            <PublishingForm
              evaluationId={evaluationId}
              proposalId={proposalId}
              onSubmit={() => {
                close();
                onPublish();
              }}
              pageId={pageId}
            />
          </Modal>
        </>
      )}
      {!checkingProposal && proposal && (
        <Link
          sx={{ display: 'flex', verticalAlign: 'center' }}
          color='textPrimary'
          external
          target='_blank'
          href={`https://snapshot.org/#/${proposal.space.id}/proposal/${proposal.id}`}
        >
          {renderContent({
            label: 'View on Snapshot',
            icon: <ExitToAppIcon fontSize='small' sx={{ m: 'auto', mr: 1 }} />
          })}
        </Link>
      )}
    </>
  );
}
