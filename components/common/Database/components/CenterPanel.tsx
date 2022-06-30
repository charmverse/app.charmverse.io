
import ViewHeader from 'components/common/BoardEditor/focalboard/src/components/viewHeader/viewHeader';
import Kanban from 'components/common/BoardEditor/focalboard/src/components/kanban/kanban';
import Table from 'components/common/BoardEditor/focalboard/src/components/table/table';
import type { DatabaseContext } from '../Database.context';

// loosely based off centerPanel.tsx in /focalboard/

export default function DatabaseView (props: DatabaseContext) {

  const addCard = () => Promise.resolve();
  const addCardTemplate = () => {};
  const editCardTemplate = () => {};
  const showCard = () => {};
  const cardClicked = () => {};

  const activeView = props.views.find(view => view.id === props.activeViewId) || props.views[0];
  const cards = Object.values(props.cards);

  return (
    <>
      <ViewHeader
        activeView={activeView}
        board={props.board}
        cards={cards}
        views={props.views}
        addCard={addCard}
        addCardTemplate={addCardTemplate}
        editCardTemplate={editCardTemplate}
        readonly={true}
      />
      <div className='container-container'>
        {activeView.fields.viewType === 'board'
          && (
            <Kanban
              board={props.board}
              activeView={activeView}
              cards={cards}
              visibleGroups={[]}
              hiddenGroups={[]}
              selectedCardIds={[]}
              readonly={true}
              onCardClicked={cardClicked}
              addCard={addCard}
              showCard={showCard}
            />
          )}
        {activeView.fields.viewType === 'table'
          && (
            <Table
              board={props.board}
              activeView={activeView}
              cards={cards}
              views={props.views}
              visibleGroups={[]}
              selectedCardIds={[]}
              readonly={true}
              cardIdToFocusOnRender=''
              showCard={showCard}
              addCard={addCard}
              onCardClicked={cardClicked}
            />
          )}
      </div>
    </>
  );
}
