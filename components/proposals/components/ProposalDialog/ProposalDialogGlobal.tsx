import { useProposalDialog } from './hooks/useProposalDialog';
import { ProposalDialog } from './ProposalDialog';

// a wrapper of page dialog that uses usePageDialogHook
export default function ProposalDialogGlobal() {
  const { props, hideProposal } = useProposalDialog();
  const { newProposal } = props;

  // include postId: when creating a draft, the dialog is open due to 'newPost' being set.
  // once we save it, we need to load it as 'post' but keep the dialog open in the meantime
  if (newProposal) {
    return <ProposalDialog isLoading={false} onClose={hideProposal} />;
  }
  return null;
}
