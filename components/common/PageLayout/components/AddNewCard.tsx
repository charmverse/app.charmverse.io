import AddIcon from '@mui/icons-material/Add';
import { Tooltip } from '@mui/material';
import { useRouter } from 'next/router';
import { memo } from 'react';
import { mutate } from 'swr';

import charmClient from 'charmClient';
import { createCard } from 'components/common/BoardEditor/focalboard/src/blocks/card';
import { addCard } from 'components/common/BoardEditor/focalboard/src/store/cards';
import { useAppDispatch } from 'components/common/BoardEditor/focalboard/src/store/hooks';
import { StyledIconButton } from 'components/common/PageLayout/components/NewPageMenu';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { usePages } from 'hooks/usePages';

function AddNewCard ({ pageId }: { pageId: string }) {
  const router = useRouter();
  const space = useCurrentSpace();
  const { pages } = usePages();
  const dispatch = useAppDispatch();

  return (
    <Tooltip disableInteractive title='Add a page inside' leaveDelay={0} placement='top' arrow>
      <StyledIconButton onClick={async () => {
        const card = createCard();
        const page = pages[pageId];
        if (page && page.boardId && space) {
          card.parentId = page.boardId;
          card.rootId = page.boardId;
          card.fields.properties = { ...card.fields.properties };
          card.fields.contentOrder = [];
          await charmClient.insertBlocks([card], () => null);
          router.push(`/${space.domain}/${page.path}?cardId=${card.id}`);
          mutate(`pages/${space.id}`);
          dispatch(addCard(card));
        }
      }}
      >
        <AddIcon color='secondary' />
      </StyledIconButton>
    </Tooltip>
  );
}

export default memo(AddNewCard);
