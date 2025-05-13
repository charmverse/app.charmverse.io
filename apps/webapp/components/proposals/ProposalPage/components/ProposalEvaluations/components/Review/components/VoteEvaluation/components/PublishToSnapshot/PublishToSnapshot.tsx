import PublishIcon from '@mui/icons-material/ElectricBolt';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import { usePopupState } from 'material-ui-popup-state/hooks';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';

import { useUpdateSnapshotProposal } from 'charmClient/hooks/proposals';
import Link from 'components/common/Link';
import { LoadingIcon } from 'components/common/LoadingComponent';
import { Modal } from 'components/common/Modal';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { getSnapshotProposal } from '@packages/lib/snapshot/getProposal';
import type { SnapshotProposal } from '@packages/lib/snapshot/interfaces';

import { PublishingForm } from './components/PublishingForm';

interface Props {
  pageId: string;
  evaluationId: string;
  proposalId: string;
  snapshotProposalId: string | null;
  renderContent: (props: { onClick?: () => void; label: string; icon: ReactNode }) => ReactNode;
  onPublish: () => void;
}

export function PublishToSnapshot({
  pageId,
  snapshotProposalId,
  renderContent,
  evaluationId,
  proposalId,
  onPublish
}: Props) {
  const [checkingProposal, setCheckingProposal] = useState(!!snapshotProposalId);
  const [snapshotProposal, setSnapshotProposal] = useState<SnapshotProposal | null>(null);
  const { space: currentSpace } = useCurrentSpace();
  const { trigger: updateProposalEvaluation } = useUpdateSnapshotProposal({ proposalId });

  const { isOpen, open, close } = usePopupState({ variant: 'popover', popupId: 'publish-proposal' });

  async function verifyProposal(snapshotId: string) {
    const _snapshotProposal = await getSnapshotProposal(snapshotId);
    if (!_snapshotProposal) {
      await updateProposalEvaluation({
        evaluationId,
        snapshotProposalId: null
      });
    }
    return _snapshotProposal;
  }

  useEffect(() => {
    async function init() {
      if (snapshotProposalId) {
        const _snapshotProposal = await verifyProposal(snapshotProposalId);
        setSnapshotProposal(_snapshotProposal);
      } else {
        setSnapshotProposal(null);
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
      {!checkingProposal && !snapshotProposal && (
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
      {!checkingProposal && snapshotProposal && (
        <Link
          sx={{ display: 'flex', verticalAlign: 'center' }}
          color='textPrimary'
          external
          target='_blank'
          href={`https://snapshot.org/#/${snapshotProposal.space.id}/proposal/${snapshotProposal.id}`}
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
