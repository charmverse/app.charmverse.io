import AddIcon from '@mui/icons-material/Add';
import { Tooltip } from '@mui/material';
import { useRouter } from 'next/router';
import { memo } from 'react';

import charmClient from 'charmClient';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { usePages } from 'hooks/usePages';
import { createCard } from 'lib/focalboard/card';

import { StyledIconButton } from './NewPageMenu';

function AddNewCard({ pageId }: { pageId: string }) {
  const router = useRouter();
  const space = useCurrentSpace();
  const { pages } = usePages();

  return (
    <Tooltip disableInteractive title='Add a page inside' leaveDelay={0} placement='top' arrow>
      <StyledIconButton
        onClick={async (e) => {
          const card = createCard();
          const page = pages[pageId];
          if (page && page.boardId && space) {
            card.parentId = page.boardId;
            card.rootId = page.boardId;
            card.fields.properties = { ...card.fields.properties };
            card.fields.contentOrder = [];
            await charmClient.insertBlocks([card], () => null);
            router.push(`/${space.domain}/${page.path}?cardId=${card.id}`);
          }
          e.stopPropagation();
        }}
      >
        <AddIcon color='secondary' />
      </StyledIconButton>
    </Tooltip>
  );
}

export default memo(AddNewCard);
