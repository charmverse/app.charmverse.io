import type { PageMeta } from '@charmverse/core/pages';
import type { ProposalWithUsers } from '@charmverse/core/proposals';

import { KanbanPageActionsMenuButton } from 'components/common/PageActions/KanbanPageActionButton';
import { useTasks } from 'components/nexus/hooks/useTasks';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { useUser } from 'hooks/useUser';

interface ProposalActionsProps {
  deleteProposal: (voteId: string) => Promise<void>;
  editProposal: (voteId: string) => void;
  proposal: ProposalWithUsers;
  page?: PageMeta;
}

export function ProposalActionsMenu({ page, deleteProposal, editProposal, proposal }: ProposalActionsProps) {
  const { user } = useUser();
  const isAdmin = useIsAdmin();
  const { mutate: refetchTasks } = useTasks();
  const showContextMenu = isAdmin || proposal.authors.some((author) => author.userId === user?.id);

  if (!showContextMenu) {
    return null;
  }

  return (
    <KanbanPageActionsMenuButton
      page={page}
      onClickDelete={() => {
        deleteProposal(proposal.id);
        refetchTasks();
      }}
      onClickEdit={() => editProposal(proposal.id)}
    />
  );
}
