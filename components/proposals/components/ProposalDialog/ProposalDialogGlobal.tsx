import { DocumentPageProviders } from 'components/[pageId]/DocumentPage/DocumentPageProviders';

import { useProposalDialog } from './hooks/useProposalDialog';
import { ProposalDialog } from './ProposalDialog';

// a wrapper of page dialog that uses usePageDialogHook
export default function ProposalDialogGlobal() {
  const { props, hideProposal } = useProposalDialog();
  const { newProposal, pageId } = props;
  if (newProposal || pageId) {
    return (
      <DocumentPageProviders isInsideDialog={true}>
        <ProposalDialog newProposal={newProposal} pageId={pageId} onClose={hideProposal} />
      </DocumentPageProviders>
    );
  }
  return null;
}
