import { createCard } from '@packages/databases/card';
import { memo } from 'react';

import charmClient from 'charmClient';
import { useCharmRouter } from 'hooks/useCharmRouter';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { usePages } from 'hooks/usePages';

import { AddIconButton } from '../../AddIconButton';

function AddNewCard({ pageId }: { pageId: string }) {
  const { updateURLQuery } = useCharmRouter();
  const { space } = useCurrentSpace();
  const { pages } = usePages();

  return (
    <AddIconButton
      tooltip='Add a page inside'
      onClick={async (e) => {
        const card = createCard();
        const page = pages[pageId];
        if (page && page.boardId && space) {
          card.parentId = page.boardId;
          card.rootId = page.boardId;
          card.fields.properties = { ...card.fields.properties };
          card.fields.contentOrder = [];
          await charmClient.insertBlocks([card], () => null);
          updateURLQuery({ cardId: card.id });
        }
        e.stopPropagation();
      }}
    />
  );
}

export default memo(AddNewCard);
