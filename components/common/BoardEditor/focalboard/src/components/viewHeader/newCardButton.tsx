
import Box from '@mui/material/Box';
import { Page } from '@prisma/client';
import Button from 'components/common/Button';
import { DownIcon } from 'components/common/Icons/DownIcon';
import { usePages } from 'hooks/usePages';
import { bindTrigger, usePopupState } from 'material-ui-popup-state/hooks';
import React from 'react';
import { Card } from '../../blocks/card';
import { getCurrentBoardTemplates } from '../../store/cards';
import { useAppSelector } from '../../store/hooks';
import { TemplatesMenu } from 'components/common/TemplatesMenu';


type Props = {
    addCard: () => void
    addCardFromTemplate: (cardTemplateId: string) => void
    addCardTemplate: () => void
    editCardTemplate: (cardTemplateId: string) => void
    deleteCardTemplate: (cardTemplateId: string) => void
    showCard: (cardId: string) => void
    boardId: string;
}

const NewCardButton = React.memo(({addCard, addCardFromTemplate, addCardTemplate, deleteCardTemplate, editCardTemplate, showCard, boardId}: Props): JSX.Element => {
  const cardTemplates: Card[] = useAppSelector(getCurrentBoardTemplates);
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const {pages, getPagePermissions} = usePages()

  const cardTemplatesPages = cardTemplates.map(c => pages[c.id]).filter(p => p !== undefined) as Page[]

  const popupState = usePopupState({variant: 'popover', popupId: 'templates-menu'});

  const boardTitle = boardId ? (pages[boardId]?.title || 'Untitled' ) : undefined;

  const pagePermissions = getPagePermissions(boardId);

  return (
    <>
    <Button
      sx={{p: 0}}
      ref={buttonRef}
    >
      <Box
        sx={{pl:'15px'}}
        onClick={() => {
          addCard();
      }}>
      New
      </Box>

      <Box sx={{pl: 1}}
        {...bindTrigger(popupState)}>
        <DownIcon />
      </Box>
    </Button>
    <TemplatesMenu
        addPageFromTemplate={addCardFromTemplate}
        createTemplate={addCardTemplate}
        editTemplate={showCard}
        deleteTemplate={deleteCardTemplate}
        pages={cardTemplatesPages}
        anchorEl={buttonRef.current as Element}
        popupState={popupState}
        boardTitle={boardTitle}
        enableItemOptions={pagePermissions?.edit_content}
        enableNewTemplates={pagePermissions?.edit_content}
      />
    </>
    
  );
});

export default NewCardButton;
