import { useProposalDialog } from './hooks/useProposalDialog';
import { ProposalDialog } from './ProposalDialog';

// a wrapper of page dialog that uses usePageDialogHook
export default function ProposalDialogGlobal() {
  const { props, hideProposal } = useProposalDialog();
  const { newProposal, pageId } = props;
  if (newProposal || pageId) {
    return <ProposalDialog newProposal={newProposal} pageId={pageId} onClose={hideProposal} />;
  }
  return null;
}
