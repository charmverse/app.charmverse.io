// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import { useRouter } from 'next/router';
import React, { useCallback, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { Board, IPropertyTemplate } from 'components/common/BoardEditor/focalboard/src/blocks/board';
import { BoardView } from 'components/common/BoardEditor/focalboard/src/blocks/boardView';
import { Card } from 'components/common/BoardEditor/focalboard/src/blocks/card';
import Button from 'components/common/BoardEditor/focalboard/src/widgets/buttons/button';
import ViewTabs from 'components/common/BoardEditor/focalboard/src/components/viewHeader/viewTabs';

import ModalWrapper from 'components/common/BoardEditor/focalboard/src/components/modalWrapper';

import FilterComponent from 'components/common/BoardEditor/focalboard/src/components/viewHeader/filterComponent';
import NewCardButton from 'components/common/BoardEditor/focalboard/src/components/viewHeader/newCardButton';
import ViewHeaderSortMenu from 'components/common/BoardEditor/focalboard/src/components/viewHeader/viewHeaderSortMenu';

type Props = {
    board: Board
    activeView: BoardView
    views: BoardView[]
    cards: Card[]
    addCard: () => void
    // addCardFromTemplate: (cardTemplateId: string) => void
    addCardTemplate: () => void
    editCardTemplate: (cardTemplateId: string) => void
    readonly: boolean
}

const ViewHeader = React.memo((props: Props) => {
  const router = useRouter();
  const [showFilter, setShowFilter] = useState(false);

  const { board, activeView, views, cards } = props;

  const withSortBy = activeView.fields.viewType !== 'calendar';

  const hasFilter = activeView.fields.filter && activeView.fields.filter.filters?.length > 0;

  const showView = useCallback((viewId) => {
    router.push({ pathname: router.pathname,
      query: {
        ...router.query,
        viewId: viewId || ''
      } }, undefined, { shallow: true });
  }, [router.query]);

  return (
    <div className='ViewHeader'>

      <ViewTabs
        views={views}
        readonly={props.readonly}
        showView={showView}
        board={board}
        activeView={activeView}
      />

      <div className='octo-spacer' />

      {/* Filter */}

      <ModalWrapper>
        <Button
          active={hasFilter}
          onClick={() => setShowFilter(true)}
        >
          <FormattedMessage
            id='ViewHeader.filter'
            defaultMessage='Filter'
          />
        </Button>
        {showFilter
                    && (
                    <FilterComponent
                      board={board}
                      activeView={activeView}
                      onClose={() => setShowFilter(false)}
                    />
                    )}
      </ModalWrapper>

      {/* Sort */}

      {withSortBy
                    && (
                    <ViewHeaderSortMenu
                      properties={board.fields.cardProperties}
                      activeView={activeView}
                      orderedCards={cards}
                    />
                    )}

      {/* Search */}

      {/* <ViewHeaderSearch /> */}

      {/* Options menu */}

      {!props.readonly && (
      <>
        {/* <ViewHeaderActionsMenu
              board={board}
              activeView={activeView}
              cards={cards}
            /> */}

        {/* New card button */}

        <NewCardButton
          addCard={props.addCard}
                  // addCardFromTemplate={props.addCardFromTemplate}
          addCardTemplate={props.addCardTemplate}
          editCardTemplate={props.editCardTemplate}
        />
      </>
      )}
    </div>
  );
});

export default ViewHeader;
