import { useRouter } from 'next/router';

import Table from 'components/common/BoardEditor/focalboard/src/components/table/table';
import { useProposalDialog } from 'components/proposals/components/ProposalDialog/hooks/useProposalDialog';
import { useProposalsBoard } from 'components/proposals/hooks/useProposalsBoard';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { setUrlWithoutRerender } from 'lib/utilities/browser';

export function ProposalsBoard() {
  const isAdmin = useIsAdmin();
  const { showProposal, hideProposal } = useProposalDialog();
  const { board: activeBoard, views, cards, card, cardPages, activeView } = useProposalsBoard();
  const router = useRouter();

  function onClose() {
    setUrlWithoutRerender(router.pathname, { id: null });
    hideProposal();
  }

  function openPage(pageId: string | null) {
    if (!pageId) return;

    setUrlWithoutRerender(router.pathname, { id: pageId });
    showProposal({
      pageId,
      onClose
    });
  }

  return (
    <Table
      board={activeBoard}
      activeView={activeView}
      cardPages={cardPages}
      groupByProperty={undefined}
      views={views}
      visibleGroups={[]}
      selectedCardIds={[]}
      readOnly={true}
      readOnlySourceData={true}
      cardIdToFocusOnRender=''
      showCard={openPage}
      addCard={async () => {}}
      onCardClicked={() => {}}
      disableAddingCards={true}
      readOnlyTitle={true}
    />
  );
}
