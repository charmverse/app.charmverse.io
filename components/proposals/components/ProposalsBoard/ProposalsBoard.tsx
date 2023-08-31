import Table from 'components/common/BoardEditor/focalboard/src/components/table/table';
import { useProposals } from 'components/proposals/hooks/useProposals';
import { useProposalsBoard } from 'components/proposals/hooks/useProposalsBoard';
import { useIsAdmin } from 'hooks/useIsAdmin';

export function ProposalsBoard() {
  const isAdmin = useIsAdmin();
  const { proposals } = useProposals();
  const { board: activeBoard, views, cards, card, cardPages, activeView } = useProposalsBoard();

  return (
    <div className='focalboard-body full-page'>
      <Table
        board={activeBoard}
        activeView={activeView}
        cardPages={cardPages}
        groupByProperty={undefined}
        views={views}
        visibleGroups={[]}
        selectedCardIds={[]}
        readOnly={!isAdmin}
        readOnlySourceData={false}
        cardIdToFocusOnRender=''
        showCard={() => {}}
        addCard={async () => {}}
        onCardClicked={() => {}}
        disableAddingCards={true}
        readOnlyTitle={true}
      />
    </div>
  );
}
