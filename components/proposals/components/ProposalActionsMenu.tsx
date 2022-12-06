import { PageActions } from 'components/common/PageActions';
import useTasks from 'components/nexus/hooks/useTasks';
import useIsAdmin from 'hooks/useIsAdmin';
import { useUser } from 'hooks/useUser';
import type { PageMeta } from 'lib/pages';
import type { ProposalWithUsers } from 'lib/proposal/interface';

interface ProposalActionsProps {
  deleteProposal: (voteId: string) => Promise<void>;
  editProposal: (voteId: string) => void;
  proposal: ProposalWithUsers;
  page: PageMeta;
}

export default function ProposalActionsMenu({ page, deleteProposal, editProposal, proposal }: ProposalActionsProps) {
  const { user } = useUser();
  const isAdmin = useIsAdmin();
  const { mutate: refetchTasks } = useTasks();
  const showContextMenu = isAdmin || proposal.authors.some((author) => author.userId === user?.id);

  if (!showContextMenu) {
    return null;
  }

  return (
    <PageActions
      page={page}
      onClickDelete={() => {
        deleteProposal(proposal.id);
        refetchTasks();
      }}
      onClickEdit={() => editProposal(proposal.id)}
    />
  );
}
