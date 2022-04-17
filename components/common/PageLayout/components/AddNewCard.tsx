import charmClient from 'charmClient';
import { createCard } from 'components/common/BoardEditor/focalboard/src/blocks/card';
import { createCharmTextBlock } from 'components/common/BoardEditor/focalboard/src/blocks/charmBlock';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useRouter } from 'next/router';
import { Tooltip } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { usePages } from 'hooks/usePages';
import { StyledIconButton } from 'components/common/PageLayout/components/NewPageMenu';
import { useAppDispatch } from 'components/common/BoardEditor/focalboard/src/store/hooks';
import { addCard } from 'components/common/BoardEditor/focalboard/src/store/cards';
import { mutate } from 'swr';

export default function AddNewCard ({ pageId }: {pageId: string}) {
  const router = useRouter();
  const [space] = useCurrentSpace();
  const { pages } = usePages();
  const dispatch = useAppDispatch();

  return (
    <Tooltip disableInteractive title='Add a page inside' leaveDelay={0} placement='right' arrow>
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
