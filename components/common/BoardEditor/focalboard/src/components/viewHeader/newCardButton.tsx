
import { KeyboardArrowDown } from '@mui/icons-material';
import Box from '@mui/material/Box';
import ButtonGroup from '@mui/material/ButtonGroup';
import { bindTrigger, usePopupState } from 'material-ui-popup-state/hooks';
import React from 'react';

import Button from 'components/common/Button';
import { DownIcon } from 'components/common/Icons/DownIcon';
import { TemplatesMenu } from 'components/common/TemplatesMenu';
import { usePages } from 'hooks/usePages';
import type { PageMeta } from 'lib/pages';

import type { Card } from '../../blocks/card';
import { getCurrentBoardTemplates } from '../../store/cards';
import { useAppSelector } from '../../store/hooks';

type Props = {
    addCard: () => void;
    addCardFromTemplate: (cardTemplateId: string) => void;
    addCardTemplate: () => void;
    editCardTemplate: (cardTemplateId: string) => void;
    deleteCardTemplate: (cardTemplateId: string) => void;
    showCard: (cardId: string) => void;
    boardId: string;
}

const NewCardButton = React.memo(({ addCard, addCardFromTemplate, addCardTemplate, deleteCardTemplate, editCardTemplate, showCard, boardId }: Props):
  JSX.Element => {
  const cardTemplates: Card[] = useAppSelector(getCurrentBoardTemplates);
  const buttonRef = React.useRef<HTMLDivElement>(null);
  const { pages, getPagePermissions } = usePages();

  const cardTemplatesPages = cardTemplates.map(c => pages[c.id]).filter(p => p !== undefined) as PageMeta[];

  const popupState = usePopupState({ variant: 'popover', popupId: 'templates-menu' });

  const boardTitle = boardId ? (pages[boardId]?.title || 'Untitled') : undefined;

  const pagePermissions = getPagePermissions(boardId);

  return (
    <>
      <ButtonGroup variant='contained' ref={buttonRef}>
        <Button onClick={addCard}>
          New
        </Button>
        <Button size='small' onClick={popupState.open}>
          <KeyboardArrowDown />
        </Button>
      </ButtonGroup>

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
